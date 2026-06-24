const { remote } = require('webdriverio');

async function likearPostInstagram(urlPost) {
    // 1. Limpiar la URL de rastreadores (separa por el '?' y se queda con la primera parte)
    const urlLimpia = urlPost.split('?')[0];
    
    console.log(`🔌 Conectando a Appium para dar like a: ${urlLimpia}`);

    const driver = await remote({
        hostname: '127.0.0.1',
        port: 4723,
        path: '/',
        logLevel: 'error',
        capabilities: {
            platformName: 'Android',
            'appium:deviceName': 'SM-A346M',
            'appium:udid': 'RFCW602986H',
            'appium:platformVersion': '16',
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'com.instagram.android',
            'appium:appActivity': 'com.instagram.mainactivity.InstagramMainActivity',
            'appium:noReset': true,
            'appium:autoGrantPermissions': true
        }
    });

    try {
        console.log('📱 Asegurando que la app esté iniciada en primer plano (Warm Start)...');
        // Activamos la app en lugar de cerrarla. Esto evita el bug de inicio en frío.
        await driver.activateApp('com.instagram.android');
        await driver.pause(3000); // Damos tiempo a que cargue el feed base

        console.log('🔗 Inyectando el Deep Link limpio...');
        await driver.execute('mobile: deepLink', { 
            url: urlLimpia, 
            package: 'com.instagram.android' 
        });
        
        await driver.pause(5000); 

        console.log('❤️ Buscando botón de Me gusta...');
        const btnLike = await driver.$('android=new UiSelector().description("Me gusta")');
        
        if (await btnLike.isExisting()) {
            await btnLike.click();
            await driver.pause(2000);
            return { success: true, mensaje: '¡Like dado con éxito a la publicación específica!' };
        } else {
            return { success: false, mensaje: 'No se encontró el botón "Me gusta" (¿Ya tiene like?).' };
        }

    } catch (error) {
        throw new Error(error.message);
    } finally {
        await driver.deleteSession();
    }
}

// Llama a la función con el link real de una publicación
likearPostInstagram('https://www.instagram.com/p/DY12t5CDGgc/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==');