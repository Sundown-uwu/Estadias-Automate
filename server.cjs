const express = require('express');
const cors = require('cors');
const { remote } = require('webdriverio');
const { exec } = require('child_process');
const util = require('util');
const path = require('path'); // Requerido para la ruta de la base de datos
const { Sequelize, DataTypes } = require('sequelize'); // Importamos Sequelize
const Dispositivo = require('./models/Dispositivo.cjs');
const HistorialTarea = require('./models/HistorialTarea.cjs'); 

const execPromise = util.promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 💾 CONFIGURACIÓN E INICIALIZACIÓN DE LA DB
// ==========================================
// Crea el archivo "autocontrol.sqlite" automáticamente en la raíz de tu proyecto backend
const sequelize = require('./config/database.cjs');

// ==========================================
// FUNCIÓN AUXILIAR: Genera las capabilities
// ==========================================
function obtenerConfiguracionDispositivo(deviceId, deviceName) {
    return {
        hostname: '127.0.0.1',
        port: 4723,
        path: '/',
        logLevel: 'error',
        capabilities: {
            platformName: 'Android',
            'appium:deviceName': deviceName,
            'appium:udid': deviceId,
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'com.instagram.android',
            'appium:appActivity': 'com.instagram.mainactivity.InstagramMainActivity',
            'appium:noReset': true,
            'appium:autoGrantPermissions': true,
            'appium:ensureWebviewsHavePages': true,
            'appium:nativeWebScreenshot': true,
            'appium:newCommandTimeout': 3600,
            'appium:connectHardwareKeyboard': true
        }
    };
}

// ==========================================
// FUNCIÓN DE SCROLL (W3C Actions)
// ==========================================
async function scrollHaciaAbajo(driver) {
    console.log('👇 Ejecutando downscroll para revelar elementos ocultos...');
    const windowSize = await driver.getWindowRect();
    const centroX = Math.floor(windowSize.width / 2);
    const startY = Math.floor(windowSize.height * 0.7);
    const endY = Math.floor(windowSize.height * 0.3);

    await driver.performActions([{
        type: 'pointer',
        id: 'dedo1',
        parameters: { pointerType: 'touch' },
        actions: [
            { type: 'pointerMove', duration: 0, x: centroX, y: startY },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 100 },
            { type: 'pointerMove', duration: 1400, origin: 'viewport', x: centroX, y: endY },
            { type: 'pointerUp', button: 0 }
        ]
    }]);

    await driver.pause(1500); 
    console.log('✅ Scroll completado.');
}

// ==========================================
// SECCIÓN 1: AUTOMATIZACIÓN DE SEGUIR USUARIO (⚡ RÁPIDA)
// ==========================================
async function seguirUsuarioInstagram(deviceId, deviceName, urlPerfil) {
    const urlLimpia = urlPerfil.split('?')[0]; 
    console.log(`🔌 [${deviceId}] Conectando a Appium para SEGUIR a: ${urlLimpia}`);
    
    const configDeSesion = obtenerConfiguracionDispositivo(deviceId, deviceName);
    const driver = await remote(configDeSesion);

    try {
        console.log('📱 Paso 1: "Calentando" Instagram...');
        await driver.activateApp('com.instagram.android');
        await driver.pause(2000); 

        console.log('🚀 Paso 2: Abriendo el link DIRECTAMENTE en la app de Instagram...');
        await driver.execute('mobile: deepLink', { url: urlLimpia, package: 'com.instagram.android' });
        await driver.pause(6000); 

        console.log('👤 Paso 3: Escaneando botón de Seguir con Red de Seguridad...');
        let botonSeguir = null;
        let estadoActual = "";
        let viaLocalizacion = "";

        for (let intento = 1; intento <= 15; intento++) {
            console.log(`🔍 Escaneando perfil... Intento ${intento}/15`);
            
            const btnPorId = await driver.$('android=new UiSelector().resourceId("com.instagram.android:id/profile_header_actions_button_text_view")');
            const btnPorTexto = await driver.$('android=new UiSelector().text("Seguir")');
            const btnPorTextoTambien = await driver.$('android=new UiSelector().text("Seguir también")');
            const btnPorDesc = await driver.$('android=new UiSelector().descriptionContains("Seguir a")');
            const btnYaSiguiendo = await driver.$('android=new UiSelector().text("Siguiendo")');
            const btnYaSolicitado = await driver.$('android=new UiSelector().text("Solicitado")');

            if (await btnPorId.isExisting()) {
                botonSeguir = btnPorId; estadoActual = await botonSeguir.getText(); viaLocalizacion = "ID de Perfil"; break;
            } else if (await btnPorTexto.isExisting()) {
                botonSeguir = btnPorTexto; estadoActual = "Seguir"; viaLocalizacion = "Texto Exacto"; break;
            } else if (await btnPorTextoTambien.isExisting()) {
                botonSeguir = btnPorTextoTambien; estadoActual = "Seguir también"; viaLocalizacion = "Texto Alternativo"; break;
            } else if (await btnPorDesc.isExisting()) {
                botonSeguir = btnPorDesc; estadoActual = "Seguir"; viaLocalizacion = "Descripción"; break;
            } else if (await btnYaSiguiendo.isExisting()) {
                botonSeguir = btnYaSiguiendo; estadoActual = "Siguiendo"; viaLocalizacion = "Ya Siguiendo"; break;
            } else if (await btnYaSolicitado.isExisting()) {
                botonSeguir = btnYaSolicitado; estadoActual = "Solicitado"; viaLocalizacion = "Ya Solicitado"; break;
            }
            await driver.pause(1000);
        }

        if (botonSeguir) {
            console.log(`📸 Botón localizado vía: [${viaLocalizacion}]. Estado detectado: "${estadoActual}"`);
            if (estadoActual === "Seguir" || estadoActual === "Seguir también") {
                await botonSeguir.click();
                await driver.pause(3000);
                return { success: true, mensaje: `¡Clic ejecutado con éxito en el botón! Localizado por: ${viaLocalizacion}` };
            } else if (estadoActual === "Siguiendo" || estadoActual === "Solicitado") {
                return { success: true, mensaje: `✅ Misión omitida: La cuenta ya se encuentra en estado "${estadoActual}".` };
            } else {
                return { success: false, mensaje: `⚠️ El botón arrojó un texto inesperado: "${estadoActual}".` };
            }
        } else {
            return { success: false, mensaje: '❌ No se logró encontrar el botón de Seguir.' };
        }
    } catch (error) { 
        throw new Error(error.message); 
    } finally { 
        await driver.deleteSession(); 
    }
}

// ==========================================
// SECCIÓN 2: AUTOMATIZACIÓN DE LIKE (⚡ RÁPIDA)
// ==========================================
async function likearPostInstagram(deviceId, deviceName, urlPost) {
    const urlLimpia = urlPost.split('?')[0];
    console.log(`🔌 [${deviceId}] Conectando a Appium para dar like a: ${urlLimpia}`);
    
    const configDeSesion = obtenerConfiguracionDispositivo(deviceId, deviceName);
    const driver = await remote(configDeSesion);

    try {
        console.log('📱 Paso 1: "Calentando" Instagram...');
        await driver.activateApp('com.instagram.android');
        await driver.pause(2000); 

        console.log('🚀 Paso 2: Abriendo el link DIRECTAMENTE en la app de Instagram...');
        await driver.execute('mobile: deepLink', { url: urlLimpia, package: 'com.instagram.android' });
        await driver.pause(6000); 

        console.log('❤️ Paso 3: Buscando el botón Like (Flujo: Post -> Reel -> Fallback)...');
        
        const selLikeNormal = 'android=new UiSelector().resourceId("com.instagram.android:id/row_feed_button_like")';
        const selLikeReel = 'android=new UiSelector().resourceId("com.instagram.android:id/like_button")';
        
        let botonALikear = null;
        let btnNormal = await driver.$(selLikeNormal);
        let btnReel = await driver.$(selLikeReel);

        if (await btnNormal.isExisting()) {
            botonALikear = btnNormal;
            console.log('✅ Botón de Like (Post Normal) encontrado.');
        } else if (await btnReel.isExisting()) {
            botonALikear = btnReel;
            console.log('✅ Botón de Like (Reel) encontrado.');
        } else {
            console.log('⚠️ No se encontró el botón de Like de primera instancia. Probando con Downscroll...');
            await scrollHaciaAbajo(driver);
            
            btnNormal = await driver.$(selLikeNormal);
            btnReel = await driver.$(selLikeReel);
            
            if (await btnNormal.isExisting()) botonALikear = btnNormal;
            else if (await btnReel.isExisting()) botonALikear = btnReel;
        }

        if (botonALikear) {
            const description = await botonALikear.getAttribute('content-desc');
            if (description === "Ya no me gusta") {
                return { success: true, mensaje: `✅ El post/reel ya tenía tu "Me gusta". Misión cumplida.` };
            } else {
                await botonALikear.click();
                await driver.pause(2000);
                return { success: true, mensaje: `¡Like dado con éxito al post/reel!` };
            }
        } else {
            console.log('⚠️ Botón de Like no encontrado ni con scroll. ACTIVANDO PLAN B: Doble Tap ✌️');
            
            let centroX, centroY;
            const contenedorPost = await driver.$('android=new UiSelector().resourceId("com.instagram.android:id/zoomable_view_container")');
            
            if (await contenedorPost.isExisting()) {
                const loc = await contenedorPost.getLocation();
                const size = await contenedorPost.getSize();
                centroX = Math.floor(loc.x + (size.width / 2));
                centroY = Math.floor(loc.y + (size.height / 2));
            } else {
                const windowSize = await driver.getWindowRect();
                centroX = Math.floor(windowSize.width / 2);
                centroY = Math.floor(windowSize.height / 2);
            }

            console.log(`👆 Ejecutando ráfaga de doble toque en coordenadas: X=${centroX}, Y=${centroY}`);
            await driver.performActions([{
                type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: centroX, y: centroY },
                    { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 },
                    { type: 'pause', duration: 100 },
                    { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }
                ]
            }]);

            await driver.pause(2500); 
            return { success: true, mensaje: '✅ ¡Like de Emergencia (Plan B) ejecutado con éxito vía Doble Tap!' };
        }

    } catch (error) {
        throw new Error(error.message);
    } finally {
        await driver.deleteSession();
    }
}

// ==========================================
// SECCIÓN 3: AUTOMATIZACIÓN DE COMENTARIOS (⚡ RÁPIDA)
// ==========================================
async function publicarComentarioInstagram(deviceId, deviceName, urlPost, textoComentario) {
    const urlLimpia = urlPost.split('?')[0];
    console.log(`🔌 [${deviceId}] Conending a Appium para COMENTAR en: ${urlLimpia}`);
    
    const configDeSesion = obtenerConfiguracionDispositivo(deviceId, deviceName);
    const driver = await remote(configDeSesion);

    try {
        console.log('📱 Paso 1: "Calentando" Instagram...');
        await driver.activateApp('com.instagram.android');
        await driver.pause(2000); 

        console.log('🚀 Paso 2: Abriendo link DIRECTAMENTE en la app de Instagram...');
        await driver.execute('mobile: deepLink', { url: urlLimpia, package: 'com.instagram.android' });
        await driver.pause(6000); 

        console.log('💬 Paso 3: Buscando el botón de comentarios...');
        const selComentarioNormal = 'android=new UiSelector().resourceId("com.instagram.android:id/row_feed_button_comment")';
        const selComentarioReel = 'android=new UiSelector().resourceId("com.instagram.android:id/comment_button")';

        let botonComentario = null;
        let btnNormal = await driver.$(selComentarioNormal);
        let btnReel = await driver.$(selComentarioReel);

        if (await btnNormal.isExisting()) {
            botonComentario = btnNormal;
            console.log('✅ Botón de comentario (Post Normal) encontrado.');
        } else if (await btnReel.isExisting()) {
            botonComentario = btnReel;
            console.log('✅ Botón de comentario (Reel) encontrado.');
        } else {
            console.log('⚠️ El botón de comentarios no está visible en pantalla. Ejecutando downscroll...');
            await scrollHaciaAbajo(driver);
            
            btnNormal = await driver.$(selComentarioNormal);
            btnReel = await driver.$(selComentarioReel);
            
            if (await btnNormal.isExisting()) {
                botonComentario = btnNormal;
            } else if (await btnReel.isExisting()) {
                botonComentario = btnReel;
            }
        }
        
        if (botonComentario) {
            console.log('📍 Calculando el centro exacto del botón de comentarios...');
            const loc = await botonComentario.getLocation();
            const size = await botonComentario.getSize();
            const centroX = Math.floor(loc.x + (size.width / 2));
            const centroY = Math.floor(loc.y + (size.height / 2));
            
            console.log(`👆 Lanzando TAP físico directamente en su centro: X=${centroX}, Y=${centroY}`);
            await driver.performActions([{
                type: 'pointer', id: 'finger1', parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: centroX, y: centroY },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: 150 },
                    { type: 'pointerUp', button: 0 }
                ]
            }]);
            await driver.pause(3000); 
        } else {
            throw new Error("El botón para abrir los comentarios no está visible.");
        }

        console.log('📶 Paso 4: Calculando coordenadas exactas de la caja...');
        let elementoCaja = null;
        const selectoresCajaExactos = [
            'android=new UiSelector().resourceId("com.instagram.android:id/layout_comment_thread_edittext_multiline")',
            'android=new UiSelector().className("android.widget.AutoCompleteTextView").resourceIdMatches(".*edittext.*")',
            'android=new UiSelector().resourceId("com.instagram.android:id/layout_comment_thread_edittext")'
        ];

        for (const sel of selectoresCajaExactos) {
            try {
                const el = await driver.$(sel);
                if (await el.isExisting()) {
                    elementoCaja = el;
                    console.log(`🎯 Elemento de texto localizado con éxito.`);
                    break;
                }
            } catch (e) { }
        }
        
        if (elementoCaja) {
            await elementoCaja.click();
            await driver.pause(2500); 
            
            try {
                await elementoCaja.setValue(textoComentario);
                console.log('✅ Texto insertado con éxito.');
            } catch (errInyeccion) {
                await elementoCaja.addValue(textoComentario);
            }
        } else {
            throw new Error("No se encontró el campo para escribir el comentario.");
        }

        await driver.pause(2000);

        console.log('🚀 Paso 5: Buscando el botón Publicar...');
        try {
            await driver.execute('mobile: performEditorAction', { action: 'send' });
            console.log('✅ Acción IME "Send" enviada.');
        } catch (e) {
            await driver.pressKeyCode(66); 
        }

        await driver.pause(4000); 
        return { success: true, mensaje: '¡Comentario enviado exitosamente!' };

    } catch (error) {
        throw new Error(error.message);
    } finally {
        await driver.deleteSession();
    }
}

// ==========================================
// SECCIÓN 4: ENDPOINTS DE LA API (Express)
// ==========================================

// ==========================================
// FUNCIÓN AUXILIAR: Obtener dispositivos físicos y su batería
// ==========================================
async function obtenerDispositivosDeAdb() {
  try {
    const { stdout } = await execPromise('adb devices');
    const lineas = stdout.trim().split('\n');
    const promesasDispositivos = [];

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      
      if (linea && linea.endsWith('device')) {
        const udid = linea.split('\t')[0];
        
        promesasDispositivos.push((async () => {
          let nivelBateria = 100; // Default

          try {
            const { stdout: batteryStdout } = await execPromise(`adb -s ${udid} shell dumpsys battery`);
            const coincidencia = batteryStdout.match(/level:\s*(\d+)/);
            if (coincidencia) {
              nivelBateria = parseInt(coincidencia[1], 10);
            }
          } catch (batteryError) {
            console.error(`⚠️ No se pudo leer batería de [${udid}]:`, batteryError.message);
          }

          // Retornamos el objeto básico para que la ruta de la DB lo procese
          return {
            udid: udid,
            battery: nivelBateria
          };
        })());
      }
    }
    
    // Esperamos a que terminen de leerse todas las baterías
    return await Promise.all(promesasDispositivos);

  } catch (error) {
    console.error('⚠️ Error al buscar dispositivos en ADB:', error);
    return [];
  }
}

// Ruta optimizada para escanear celulares y extraer su batería real
app.get('/api/scan-devices', async (req, res) => {
    try {
        const { stdout } = await execPromise('adb devices');
        const lineas = stdout.trim().split('\n');
        
        const promesasDispositivos = [];

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            
            if (linea && linea.endsWith('device')) {
                const udid = linea.split('\t')[0];
                
                promesasDispositivos.push((async () => {
                    let nivelBateria = 100;

                    try {
                        const { stdout: batteryStdout } = await execPromise(`adb -s ${udid} shell dumpsys battery`);
                        
                        const coincidencia = batteryStdout.match(/level:\s*(\d+)/);
                        if (coincidencia) {
                            nivelBateria = parseInt(coincidencia[1], 10);
                        }
                    } catch (batteryError) {
                        console.error(`⚠️ No se pudo leer la batería del dispositivo [${udid}]:`, batteryError.message);
                    }

                    return {
                        id: udid,
                        name: `Android (${udid})`,
                        udid: udid,
                        active: true,
                        status: "En espera",
                        action: null,
                        url: "",
                        comment: "",
                        battery: nivelBateria 
                    };
                })());
            }
        }

        const dispositivosDetectados = await Promise.all(promesasDispositivos);

        console.log(`📡 Escaneo completo: ${dispositivosDetectados.length} dispositivo(s) con batería real.`);
        res.status(200).json({ success: true, devices: dispositivosDetectados });

    } catch (error) {
        console.error(`❌ Error crítico en el escaneo ADB: ${error.message}`);
        return res.status(500).json({ success: false, error: "Fallo al procesar el escaneo de dispositivos." });
    }
});

// ==========================================
// ENDPOINT MAESTRO DINÁMICO ACTUALIZADO CON DB
// ==========================================
app.post('/api/execute-task', async (req, res) => {
    const { deviceId, deviceName, action, url, comment } = req.body;

    // 1. Creamos una variable para guardar el comentario final que usaremos
    let comentarioFinal = "";

    // 2. Verificamos si lo que llegó es una lista (arreglo) y tiene elementos
    if (Array.isArray(comment)) {
        if (comment.length >0) {
        const indiceAleatorio = Math.floor(Math.random() * comment.length);
        comentarioFinal = comment[indiceAleatorio];
        }
    }else if(comment) {
        comentarioFinal = comment;
    }

    console.log(`\n=================================================`);
    console.log(`🤖 ORDEN RECIBIDA DESDE LA INTERFAZ WEB`);
    console.log(`📱 Dispositivo UDID: ${deviceId}`);
    console.log(`🎬 Acción requerida: "${action}"`);
    console.log(`🔗 URL objetivo: ${url}`);
    if (comentarioFinal) console.log(`💬 Comentario: "${comentarioFinal}"`);
    console.log(`=================================================\n`);

    try {
        let resultado;

        switch (action) {
            case 'Seguir cuenta':
                resultado = await seguirUsuarioInstagram(deviceId, deviceName, url);
                break;
                
            case 'Reaccionar a un post':
                resultado = await likearPostInstagram(deviceId, deviceName, url);
                break;
                
            case 'Comentar en un post':
                const textoFinal = comentarioFinal || "¡Excelente contenido! 🔥";
                resultado = await publicarComentarioInstagram(deviceId, deviceName, url, textoFinal);
                break;

            case 'Mirar transmisión':
                console.log("⏳ Simulando mirar transmisión por 5 segundos...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                resultado = { success: true, mensaje: "Simulación de transmisión finalizada." };
                break;

            default:
                return res.status(400).json({ success: false, message: "❌ Acción no reconocida por el servidor." });
        }

        // 🔥 REGISTRO EN LA BASE DE DATOS (ÉXITO O ADVERTENCIA)
        await HistorialTarea.create({
            deviceId,
            deviceName,
            action,
            url,
            comment: comentarioFinal,
            status: resultado.success ? 'Éxito' : 'Fallido',
            mensaje: resultado.mensaje
        });

        res.status(200).json({ 
            success: true, 
            message: resultado.mensaje 
        });

    } catch (error) {
        console.error("❌ Error catastrófico en la automatización:", error.message);

        // ❌ REGISTRO EN LA BASE DE DATOS (ERROR / CRASH DE APPIUM)
        await HistorialTarea.create({
            deviceId,
            deviceName,
            action,
            url,
            comment: comentarioFinal,
            status: 'Error',
            mensaje: error.message
        });

        res.status(500).json({ 
            success: false, 
            message: "Error interno en Appium: " + error.message 
        });
    }
});

// ==========================================
// 🚀 NUEVO ENDPOINT: CONSULTAR HISTORIAL DESDE REACT
// ==========================================
app.get('/api/history', async (req, res) => {
    try {
        // Trae todos los logs ordenados por fecha de creación (los más nuevos primero)
        const historial = await HistorialTarea.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, history: historial });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/devices', async (req, res) => {
    try {
        // 1. Obtener todos los celulares guardados en la Base de Datos SQLite
        const dbDevices = await Dispositivo.findAll();

        // 2. Hacer el escaneo físico actual (obtiene udid y battery mediante promesas de ADB)
        const conectadosFisicamente = await obtenerDispositivosDeAdb(); 

        // 3. Cruzar los datos para saber cuáles están online, inyectar batería y registrar nuevos
        const dispositivosActualizados = [];

        // Primero, procesamos los que están físicamente conectados ahora mismo
        for (const fisic of conectadosFisicamente) {
            // Si es nuevo, lo guardamos. Si ya existe, mantiene sus datos intactos.
            // Nota: Aquí pasamos el name genérico de ADB por si es la primera vez que se registra
            const [dispositivoDb] = await Dispositivo.findOrCreate({
                where: { udid: fisic.udid },
                defaults: { name: fisic.name || `Android (${fisic.udid})`, customName: "" }
            });

            dispositivosActualizados.push({
                id: dispositivoDb.udid,
                udid: dispositivoDb.udid,
                name: dispositivoDb.customName || dispositivoDb.name, // Si tiene alias (customName), usa el alias
                customName: dispositivoDb.customName,
                originalName: dispositivoDb.name,
                connected: true,      // Para tu lógica de control interna
                active: true,         // 🔥 Esto le dice al Switch de React que se renderice ACTIVADO por defecto
                status: "En espera",  // Estado para dispositivos conectados
                action: null,
                url: "",
                comment: "",
                battery: fisic.battery // 🔋 Aquí inyectamos el nivel real que vino desde ADB
            });
        }

        // Ahora, buscamos los que están en la DB pero NO se detectaron físicamente (Offline)
        for (const dbDev of dbDevices) {
            const estaConectado = conectadosFisicamente.some(f => f.udid === dbDev.udid);
            
            if (!estaConectado) {
                dispositivosActualizados.push({
                    id: dbDev.udid,
                    udid: dbDev.udid,
                    name: dbDev.customName || dbDev.name,
                    customName: dbDev.customName,
                    originalName: dbDev.name,
                    connected: false,     // Desconectado físicamente
                    active: false,        // 🔥 Esto le dice al Switch de React que se ponga INACTIVO por defecto
                    status: "Desconectado", // Esto le dirá a React que pinte la tarjeta en gris
                    action: null,
                    url: "",
                    comment: "",
                    battery: 0            // Si está desconectado, marcamos 0 en la batería
                });
            }
        }

        // Devolvemos la respuesta unificada a React
        // Nota: Asegúrate de revisar si tu Frontend espera recibir el array directo o dentro de un objeto:
        // Si tu frontend usaba res.data directamente como array, usa: res.json(dispositivosActualizados);
        // Si usaba res.data.devices, deja esta línea intacta:
        res.json({ success: true, devices: dispositivosActualizados });
    } catch (error) {
        console.error("❌ Error en la API /api/devices unificada:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// RUTA PARA RENOMBRAR DISPOSITIVOS (CON DIAGNÓSTICO)
// ==========================================
app.put('/api/devices/:udid/rename', async (req, res) => {
    console.log("\n====== 🟡 INTENTO DE RENOMBRAR DISPOSITIVO ======");
    console.log("➡️ UDID recibido del cliente:", req.params.udid);
    console.log("➡️ Nuevo nombre (customName) recibido:", req.body.customName);

    try {
        const { udid } = req.params;
        const { customName } = req.body;

        // Intentamos buscar el dispositivo en SQLite
        const dispositivo = await Dispositivo.findOne({ where: { udid: udid } });

        if (dispositivo) {
            console.log("✨ Dispositivo encontrado en la base de datos vieja:", dispositivo.name);
            
            // Actualizamos y guardamos
            dispositivo.customName = customName;
            await dispositivo.save();
            
            console.log("✅ ¡ÉXITO! Guardado correctamente en la base de datos SQLite.");
            return res.json({ success: true, message: 'Nombre actualizado correctamente' });
        } else {
            // 🔥 HIPÓTESIS: A veces el dispositivo está conectado pero aún no existe un registro en la BD
            console.log("❓ El dispositivo no existía en la BD. Creando un registro nuevo...");
            
            await Dispositivo.create({
                udid: udid,
                name: udid, // Usamos el udid temporalmente como nombre base
                customName: customName
            });

            console.log("✅ ¡ÉXITO! Registro creado y alias guardado correctamente.");
            return res.json({ success: true, message: 'Dispositivo registrado y renombrado' });
        }
    } catch (error) {
        console.error('❌ ERROR CRÍTICO EN EL BACKEND:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// INICIAR SERVIDOR CON CONEXIÓN ASÍNCRONA A LA DB
// ==========================================
const PORT = 3000;
app.use(express.static('public')); 

// Sincronizamos las tablas y luego encendemos Express
sequelize.sync({ alter: true }) // 'force: false' asegura que tus datos no se borren al reiniciar el servidor
  .then(() => {
    console.log('💾 Base de datos SQLite sincronizada correctamente.');
    app.listen(PORT, () => console.log(`🚀 Servidor unificado listo en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Error crítico al inicializar la Base de Datos:', err);
  });