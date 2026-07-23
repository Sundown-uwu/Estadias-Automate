const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { remote } = require('webdriverio');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
const Dispositivo = require('./models/Dispositivo.cjs');
const HistorialTarea = require('./models/HistorialTarea.cjs'); 

const execPromise = util.promisify(exec);
const app = express();

// ========================================
// Appium corre automáticamente en el puerto 4723, no es necesario iniciar otro servidor Appium.
// ========================================

const { spawn } = require('child_process');

// Iniciar Appium automáticamente al arrancar el servidor
const appiumCmd = process.platform === 'win32' ? 'appium.cmd' : 'appium';
const appiumProcess = spawn(appiumCmd, [], { shell: true });

appiumProcess.stdout.on('data', (data) => {
    console.log(`[Appium]: ${data}`);
});

appiumProcess.stderr.on('data', (data) => {
    console.error(`[Appium Error]: ${data}`);
});

// ==========================================
//  1. CONFIGURACIÓN DE WEBSOCKETS 
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", methods: ["GET", "POST", "PUT"]
    }
});

io.on('connection', (socket) => {
    console.log('Cliente React conectado al WebSocket:', socket.id);
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

app.use(cors());
app.use(express.json());

// ==========================================
// CONFIGURACIÓN E INICIALIZACIÓN DE LA DB
// ==========================================
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
            'appium:connectHardwareKeyboard': true,
            'appium:ignoreUnimportantViews': false,
            'appium:disableWindowAnimation': true,  // Desactiva transiciones para evitar lecturas de pantalla corruptas
            'appium:skipServerInstallation': true
        }
    };
}

// ==========================================
// FUNCIÓN DE SCROLL (W3C Actions)
// ==========================================
async function scrollHaciaAbajo(driver) {
    console.log('Ejecutando downscroll para revelar elementos ocultos...');
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
    console.log('Scroll completado.');
}

// ==========================================
// SECCIÓN 1: AUTOMATIZACIÓN DE SEGUIR USUARIO
// ==========================================
async function seguirUsuarioInstagram(deviceId, deviceName, urlPerfil) {
    const urlLimpia = urlPerfil.split('?')[0]; 
    console.log(`[${deviceId}] Conectando a Appium para SEGUIR a: ${urlLimpia}`);
    
    const configDeSesion = obtenerConfiguracionDispositivo(deviceId, deviceName);
    const driver = await remote(configDeSesion);

    try {
        console.log('Paso 1: "Calentando" Instagram...');
        await driver.activateApp('com.instagram.android');
        await driver.pause(2000); 

        console.log('Paso 2: Abriendo el link DIRECTAMENTE en la app de Instagram...');
        await driver.execute('mobile: deepLink', { url: urlLimpia, package: 'com.instagram.android' });
        // Estabilización para Android 15 / Vivo
        await driver.pause(7000); 

        console.log('Paso 3: Escaneando botón de Seguir con Red de Seguridad...');
        let botonSeguir = null;
        let estadoActual = "";
        let viaLocalizacion = "";

        // CAMBIO CLAVE: Cambiado a ID simple directo para evitar crasheos por UiSelector en Android 15
        const selIdPerfil = 'id=com.instagram.android:id/profile_header_actions_button_text_view';

        for (let intento = 1; intento <= 15; intento++) {
            console.log(`Escaneando perfil... Intento ${intento}/15`);
            
            const btnPorId = await driver.$(selIdPerfil);
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
            console.log(`Botón localizado vía: [${viaLocalizacion}]. Estado detectado: "${estadoActual}"`);
            if (estadoActual === "Seguir" || estadoActual === "Seguir también") {
                await botonSeguir.click();
                await driver.pause(3000);
                return { success: true, mensaje: `¡Clic ejecutado con éxito en el botón! Localizado por: ${viaLocalizacion}` };
            } else if (estadoActual === "Siguiendo" || estadoActual === "Solicitado") {
                return { success: true, mensaje: `Misión omitida: La cuenta ya se encuentra en estado "${estadoActual}".` };
            } else {
                return { success: false, mensaje: `El botón arrojó un texto inesperado: "${estadoActual}".` };
            }
        } else {
            return { success: false, mensaje: 'No se logró encontrar el botón de Seguir.' };
        }
    } catch (error) { 
        throw new Error(error.message); 
    } finally { 
        await driver.deleteSession(); 
    }
}

// ==========================================
// SECCIÓN 2: AUTOMATIZACIÓN DE LIKE
// ==========================================
async function likearPostInstagram(deviceId, deviceName, urlPost) {
    const urlLimpia = urlPost.split('?')[0];
    console.log(`[${deviceId}] Conectando a Appium para dar like a: ${urlLimpia}`);
    
    const configDeSesion = obtenerConfiguracionDispositivo(deviceId, deviceName);
    const driver = await remote(configDeSesion);

    try {
        console.log(' Paso 1: "Calentando" Instagram...');
        await driver.activateApp('com.instagram.android');
        await driver.pause(2000); 

        console.log('Paso 2: Abriendo el link DIRECTAMENTE en la app de Instagram...');
        await driver.execute('mobile: deepLink', { url: urlLimpia, package: 'com.instagram.android' });
        
        await new Promise(resolve => setTimeout(resolve, 4000));

        console.log(' Paso 3: Buscando el botón Like (Flujo: Post -> Reel -> Fallback)...');
        
        // Selector por ID directo (Evita crasheos de UIAutomator en Vivo)
        const selLikeNormal = 'id=com.instagram.android:id/row_feed_button_like';
        const selLikeReel = 'id=com.instagram.android:id/like_button';
        
        let botonALikear = null;
        let btnNormal = await driver.$(selLikeNormal);
        let btnReel = await driver.$(selLikeReel);

        if (await btnNormal.isExisting()) {
            botonALikear = btnNormal;
            console.log('Botón de Like (Post Normal) encontrado.');
        } else if (await btnReel.isExisting()) {
            botonALikear = btnReel;
            console.log('Botón de Like (Reel) encontrado.');
        } else {
            console.log('No se encontró el botón de Like de primera instancia. Probando con Downscroll...');
            await scrollHaciaAbajo(driver);
            await driver.pause(1500); 
            
            btnNormal = await driver.$(selLikeNormal);
            btnReel = await driver.$(selLikeReel);
            
            if (await btnNormal.isExisting()) botonALikear = btnNormal;
            else if (await btnReel.isExisting()) botonALikear = btnReel;
        }

        if (botonALikear) {
            const description = await botonALikear.getAttribute('content-desc');
            if (description === "Ya no me gusta") {
                return { success: true, mensaje: `El post/reel ya tenía tu "Me gusta". Misión cumplida.` };
            } else {
                await botonALikear.click();
                await driver.pause(2000);
                return { success: true, mensaje: `¡Like dado con éxito al post/reel!` };
            }
        } else {
            console.log('Botón de Like no encontrado ni con scroll. ACTIVANDO PLAN B: Doble Tap ✌️');
            
            let centroX, centroY;
            const contenedorPost = await driver.$('id=com.instagram.android:id/zoomable_view_container');
            
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

            console.log(`Ejecutando ráfaga de doble toque en coordenadas: X=${centroX}, Y=${centroY}`);
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
            return { success: true, mensaje: '¡Like de Emergencia (Plan B) ejecutado con éxito vía Doble Tap!' };
        }

    } catch (error) {
        throw new Error(error.message);
    } finally {
        await driver.deleteSession();
    }
}

// ==========================================
// SECCIÓN 3: AUTOMATIZACIÓN DE COMENTARIOS
// ==========================================
async function publicarComentarioInstagram(deviceId, deviceName, urlPost, textoComentario) {
    const urlLimpia = urlPost.split('?')[0];
    console.log(`[${deviceId}] Conectando a Appium para COMENTAR en: ${urlLimpia}`);
    
    const configDeSesion = obtenerConfiguracionDispositivo(deviceId, deviceName);
    const driver = await remote(configDeSesion);

    try {
        console.log('Paso 1: "Calentando" Instagram...');
        await driver.activateApp('com.instagram.android');
        await driver.pause(2000); 

        console.log('Paso 2: Abriendo link DIRECTAMENTE en la app de Instagram...');
        await driver.execute('mobile: deepLink', { url: urlLimpia, package: 'com.instagram.android' });
        // Estabilización para Android 15 / Vivo
        await driver.pause(7000); 

        console.log('Paso 3: Buscando el botón de comentarios...');
        // CAMBIO CLAVE: Optimizados selectores a ID nativo directo (No UiSelector masivo)
        const selComentarioNormal = 'id=com.instagram.android:id/row_feed_button_comment';
        const selComentarioReel = 'id=com.instagram.android:id/comment_button';

        let botonComentario = null;
        let btnNormal = await driver.$(selComentarioNormal);
        let btnReel = await driver.$(selComentarioReel);

        if (await btnNormal.isExisting()) {
            botonComentario = btnNormal;
            console.log('Botón de comentario (Post Normal) encontrado.');
        } else if (await btnReel.isExisting()) {
            botonComentario = btnReel;
            console.log('Botón de comentario (Reel) encontrado.');
        } else {
            console.log('El botón de comentarios no está visible en pantalla. Ejecutando downscroll...');
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
            console.log('Calculando el centro exacto del botón de comentarios...');
            const loc = await botonComentario.getLocation();
            const size = await botonComentario.getSize();
            const centroX = Math.floor(loc.x + (size.width / 2));
            const centroY = Math.floor(loc.y + (size.height / 2));
            
            console.log(`Lanzando TAP físico directamente en su centro: X=${centroX}, Y=${centroY}`);
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

        console.log('Paso 4: Calculando coordenadas exactas de la caja...');
        let elementoCaja = null;
        // CAMBIO CLAVE: Prioridad a IDs puros y fijos en lugar de búsquedas por expresiones regulares pesadas
        const selectoresCajaExactos = [
            'id=com.instagram.android:id/layout_comment_thread_edittext_multiline',
            'id=com.instagram.android:id/layout_comment_thread_edittext',
            'android=new UiSelector().className("android.widget.AutoCompleteTextView").resourceIdMatches(".*edittext.*")'
        ];

        for (const sel of selectoresCajaExactos) {
            try {
                const el = await driver.$(sel);
                if (await el.isExisting()) {
                    elementoCaja = el;
                    console.log(`Elemento de texto localizado con éxito.`);
                    break;
                }
            } catch (e) { }
        }
        
        if (elementoCaja) {
            await elementoCaja.click();
            await driver.pause(2500); 
            
            try {
                await elementoCaja.setValue(textoComentario);
                console.log('Texto insertado con éxito.');
            } catch (errInyeccion) {
                await elementoCaja.addValue(textoComentario);
            }
        } else {
            throw new Error("No se encontró el campo para escribir el comentario.");
        }

        await driver.pause(2000);

        console.log('Paso 5: Buscando el botón Publicar...');
        try {
            await driver.execute('mobile: performEditorAction', { action: 'send' });
            console.log('Acción IME "Send" enviada.');
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
// SECCIÓN 4: OBTENER DISPOSITIVOS FÍSICOS
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
          let nivelBateria = 100;
          try {
            const { stdout: batteryStdout } = await execPromise(`adb -s ${udid} shell dumpsys battery`);
            const coincidencia = batteryStdout.match(/level:\s*(\d+)/);
            if (coincidencia) nivelBateria = parseInt(coincidencia[1], 10);
          } catch (e) { }
          return { udid: udid, battery: nivelBateria, name: `Android (${udid})` };
        })());
      }
    }
    return await Promise.all(promesasDispositivos);
  } catch (error) {
    return [];
  }
}

// FUNCIÓN MAESTRA DE ESCANEO
async function obtenerEstadoCompletoDispositivos() {
    const dbDevices = await Dispositivo.findAll();
    const conectadosFisicamente = await obtenerDispositivosDeAdb(); 

    const tareasActivas = await HistorialTarea.findAll({
        where: {status: { [Op.in]: ['En cola', 'Ejecutando'] }}
    });

    const dispositivosActualizados = [];

    for (const fisic of conectadosFisicamente) {
        const [dispositivoDb] = await Dispositivo.findOrCreate({
            where: { udid: fisic.udid },
            defaults: { name: fisic.name, customName: "" }
        });

        const tarea = tareasActivas.find(t => t.deviceId === fisic.udid);
        const estadoReal = tarea ? tarea.status : "En espera";
        const accionReal = tarea ? tarea.action : null;

        dispositivosActualizados.push({
            id: dispositivoDb.udid,
            udid: dispositivoDb.udid,
            name: dispositivoDb.customName || dispositivoDb.name,
            customName: dispositivoDb.customName,
            originalName: dispositivoDb.name,
            connected: true,
            active: true,
            status: estadoReal,
            action: accionReal,
            url: tarea ? tarea.url : "",
            comment: tarea ? tarea.comment : "",
            battery: fisic.battery
        });
    }

    for (const dbDev of dbDevices) {
        if (!conectadosFisicamente.some(f => f.udid === dbDev.udid)) {
            const tarea = tareasActivas.find(t => t.deviceId === dbDev.udid);
            dispositivosActualizados.push({
                id: dbDev.udid, udid: dbDev.udid,
                name: dbDev.customName || dbDev.name, customName: dbDev.customName, originalName: dbDev.name,
                connected: false, active: false,
                status: tarea ? tarea.status : "Desconectado", action: tarea ? tarea.action : null,
                url: "", comment: "", battery: 0
            });
        }
    }
    return dispositivosActualizados;
}

// CICLO EN SEGUNDO PLANO (ADB en tiempo real)
setInterval(async () => {
    try {
        const devices = await obtenerEstadoCompletoDispositivos();
        io.emit('dispositivos_actualizados', devices);
    } catch (e) {}
}, 5000); 

// ==========================================
// GESTOR DE COLA SECUENCIAL (WORKER ÚNICO)
// ==========================================
let appiumOcupado = false; 
let globalCooldownMs = 15000; 

async function procesarCola() {
    if (appiumOcupado) return; 

    try {
        // Buscamos SOLO LA PRIMERA tarea de la fila
        const tarea = await HistorialTarea.findOne({
            where: { status: 'En cola' },
            order: [['createdAt', 'ASC']] 
        });

        if (!tarea) {
            globalCooldownMs = 15000;
            return;
        }

        appiumOcupado = true; // Bloqueamos el paso para ejecuciones concurrentes
        
        await tarea.update({ status: 'Ejecutando', mensaje: 'Procesando en Appium...' });
        io.emit('cola_actualizada');
        io.emit('estado_dispositivo', { id: tarea.deviceId, status: 'Ejecutando...' });

        let resultado = { mensaje: "Completado" };
        let huboError = false;
        try {
            switch (tarea.action) {
                case 'Seguir cuenta': resultado = await seguirUsuarioInstagram(tarea.deviceId, tarea.deviceName, tarea.url); break;
                case 'Reaccionar a un post': resultado = await likearPostInstagram(tarea.deviceId, tarea.deviceName, tarea.url); break;
                case 'Comentar en un post': resultado = await publicarComentarioInstagram(tarea.deviceId, tarea.deviceName, tarea.url, tarea.comment); break;
                case 'Mirar transmisión': await new Promise(r => setTimeout(r, 5000)); break;
            }
            await tarea.update({ status: 'Éxito', mensaje: resultado.mensaje });
        } catch (error) {
            huboError = true;
            await tarea.update({ status: 'Error', mensaje: error.message });
        }

        io.emit('estado_dispositivo', { id: tarea.deviceId, status: huboError ? 'Error' : 'Hecho!', action: null });
        io.emit('cola_actualizada'); 
        io.emit('historial_actualizado'); 

        console.log(`\nTarea terminada. Esperando cooldown de ${globalCooldownMs / 1000} segundos...\n`);
        
        setTimeout(() => {
            appiumOcupado = false; // Liberamos Appium
            procesarCola(); // Llamamos al worker para procesar el siguiente elemento
        }, globalCooldownMs);

    } catch (error) {
        console.error("Error crítico en el capataz:", error);
        appiumOcupado = false;
    }
}

// ==========================================
// SECCIÓN 5: ENDPOINTS DE LA API (Express)
// ==========================================

app.get('/api/scan-devices', async (req, res) => {
    try {
        const devices = await obtenerEstadoCompletoDispositivos();
        res.status(200).json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ success: false, error: "Fallo al procesar el escaneo." });
    }
});

app.post('/api/execute-task', async (req, res) => {
    const { deviceId, deviceName, action, url, comment, delayMs } = req.body;
    
    let comentarioFinal = "";
    if (Array.isArray(comment) && comment.length > 0) {
        comentarioFinal = comment[Math.floor(Math.random() * comment.length)];
    } else if (typeof comment === 'string') {
        comentarioFinal = comment;
    }
    
    if (delayMs !== undefined) {
        globalCooldownMs = delayMs;
    } else {
        globalCooldownMs = 15000;
    }

    try {
        await HistorialTarea.create({ 
            deviceId, 
            deviceName, 
            action, 
            url, 
            comment: comentarioFinal, 
            status: 'En cola', 
            mensaje: 'Esperando turno en la cola...' 
        });
        
        io.emit('cola_actualizada'); 
        procesarCola(); 

        res.status(200).json({ success: true, message: "En cola" });
    } catch (error) {
        console.error("Error CRÍTICO al guardar en BD:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/queue', async (req, res) => {
    try {
        const cola = await HistorialTarea.findAll({ 
            where: { status: { [Op.in]: ['En cola', 'Ejecutando'] } }, order: [['createdAt', 'ASC']] 
        });
        res.status(200).json({ success: true, queue: cola });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.put('/api/queue/cancel/:id', async (req, res) => {
    try {
        const tarea = await HistorialTarea.findByPk(req.params.id);
        if (tarea && tarea.status === 'En cola') {
            await tarea.update({ status: 'Cancelado', mensaje: 'Cancelado manualmente.' });
            io.emit('cola_actualizada'); io.emit('historial_actualizado');
            res.json({ success: true });
        } else { res.status(400).json({ success: false }); }
    } catch (error) { res.status(500).json({ success: false }); }
});

// Endpoint del historial limpio (Filtra solo los estados finales)
app.get('/api/history', async (req, res) => {
    try {
        const historial = await HistorialTarea.findAll({ 
            where: { status: { [Op.in]: ['Éxito', 'Fallido', 'Error', 'Cancelado'] } }, order: [['createdAt', 'DESC']] 
        });
        res.status(200).json({ success: true, history: historial });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/devices', async (req, res) => {
    try {
        const dispositivosActualizados = await obtenerEstadoCompletoDispositivos();
        res.json({ success: true, devices: dispositivosActualizados });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/devices/:udid/rename', async (req, res) => {
    const { udid } = req.params;
    const { customName } = req.body;

    try {
        const dispositivo = await Dispositivo.findOne({ where: { udid: udid } });
        if (dispositivo) {
            dispositivo.customName = customName;
            await dispositivo.save();
        } else {
            await Dispositivo.create({ udid: udid, name: udid, customName: customName });
        }
        
        const devices = await obtenerEstadoCompletoDispositivos();
        io.emit('dispositivos_actualizados', devices);
        
        return res.json({ success: true, message: 'Nombre actualizado correctamente' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// INICIAR SERVIDOR HTTP (MÓDULO COMPLETO)
// ==========================================
const PORT = 3000;
app.use(express.static('public')); 

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Base de datos SQLite sincronizada correctamente.');
    server.listen(PORT, '0.0.0.0', () => console.log(`Servidor HTTP/WebSocket listo en la red local ${PORT}`));
    procesarCola(); 
  })
  .catch(err => {
    console.error('Error crítico al inicializar la Base de Datos:', err);
  });