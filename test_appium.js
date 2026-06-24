const { remote } = require('webdriverio');

async function buscarEnSpotify(cancion) {
    console.log('🔌 Conectando a Appium...');

    const driver = await remote({
        hostname: '127.0.0.1',
        port: 4723,
        logLevel: 'error',
        capabilities: {
            platformName: 'Android',
            'appium:deviceName': 'SM-A346M',
            'appium:udid': 'RFCW602986H',
            'appium:platformVersion': '16',
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': 'com.spotify.music',
            'appium:appActivity': 'com.spotify.music.MainActivity',
            'appium:noReset': true,
            'appium:autoGrantPermissions': true
        }
    });

    console.log('✅ Conectado al dispositivo');

    try {
        await driver.pause(3000);
        console.log('🎵 Spotify abierto');

        // Tocar pestaña "Buscar" en la barra de navegación inferior
        console.log('🔍 Tocando pestaña Buscar...');
        const searchTab = await driver.$('android=new UiSelector().description("Buscar, Pestaña 2 de 4")');
        await searchTab.click();
        await driver.pause(2000);

        // Tocar el campo "¿Qué quieres escuchar?" (barra de búsqueda)
        console.log('⌨️ Tocando barra de búsqueda...');
        const searchBar = await driver.$('android=new UiSelector().description("Buscar algo para escuchar")');
        await searchBar.click();
        await driver.pause(2000);

        // Ahora debería aparecer el campo de texto activo — capturar y escribir
        console.log(`✍️ Escribiendo: ${cancion}`);
        const inputField = await driver.$('android=new UiSelector().focused(true)');
        await inputField.setValue(cancion);
        await driver.pause(2000);

        // Presionar Enter para buscar
        console.log('🔎 Buscando...');
        await driver.pressKeyCode(66); // KEYCODE_ENTER
        await driver.pause(3000);

        // Tocar el primer resultado
        console.log('▶️ Seleccionando primer resultado...');
        const primerResultado = await driver.$('android=new UiSelector().resourceId("com.spotify.music:id/title").instance(0)');
        await primerResultado.click();
        await driver.pause(1000);

        console.log(`✅ ¡Listo! Reproduciendo "${cancion}"`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await driver.deleteSession();
        console.log('🔌 Sesión cerrada');
    }
}

buscarEnSpotify('Lowrider');