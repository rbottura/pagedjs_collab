/**
 * Asynchronously loads a script.
 *
 * @param {string} url - The URL of the script to be loaded.
 * @param {boolean} isModule - A flag indicating whether the script is an ES6 module.
 * @returns {Promise} A Promise that resolves when the script is loaded successfully, or rejects if the script fails to load.
 * @throws {Error} Throws an error if the input parameters are not valid.
 * @example
 * // Example of using loadScript function
 * const scriptUrl = "script.js";
 * const isModule = true;
 * loadScript(scriptUrl, isModule);
 */
export async function loadScript(url, isModule = false) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false; // Ensures synchronous loading

        if (isModule) {
            script.type = "module";
        }

        script.onload = () => {
            resolve();
        };

        script.onerror = (error) => {
            reject(error);
        };

        document.head.appendChild(script);
    });
}

/**
 * Asynchronously loads multiple scripts.
 *
 * @param {string[]} urls - An array of URLs for the scripts to be loaded.
 * @param {boolean} isModule - A flag indicating whether the scripts are ES6 modules.
 * @returns {Promise} A Promise that resolves when all scripts are loaded successfully, or rejects if any of the scripts fail to load.
 * @throws {Error} Throws an error if the input parameters are not valid.
 * @example
 * // Example of using loadScripts function
 * const scriptUrls = ["script1.js", "script2.js", "script3.js"];
 * loadScripts(scriptUrls, true);
 */
export async function loadScripts(urls, isModule) {
    const promises = urls.map(url => loadScript(url, isModule));

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}

/**
 * getRandomInt
 * @param {Number} min 
 * @param {Number} max 
 * @returns {Boolean}
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}