#!/usr/bin/env node
const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const chalk = require("chalk");
const { localStore, sessionStore, editor } = require("../config/config.js");

/**
 * @param {Object} inputObject Object of key-value pairs (token) to be persisted in local session storage.
 * @description Persists given input object into local session storage.
 * Will be extended and must be discrete from persist.
 */
const authorize = inputObject => {
    const data = JSON.stringify(inputObject, null, 4);
    fs.writeFileSync(sessionStore, data);
}

/**
 * @param {Object} inputObject Object of key-value pairs (entry) to be persisted in local template storage.
 * @description Persists given input object into local template storage.
 * Will be extended and must be discrete from authorize.
 */
const persist = inputObject => {
    const data = JSON.stringify(inputObject, null, 4);
    fs.writeFileSync(localStore, data);
}

/**
 * @description Read token from local session storage.
 * @returns Token, if extant. Else, throws error.
 * Will be extended and must be discrete from mountEphemeralDoc.
 */
const readToken = () => {
    try {
        const buffer = fs.readFileSync(sessionStore);
        const data = buffer.toString();
        return JSON.parse(data);        
    }
    catch (err) {
        console.log(chalk.red(`[-] A critical error occurred during mounting. See: ${err}\n`));
    }
}

/**
 * @description Mount entry from local template storage.
 * @returns Template data, if extant. Else, throws error.
 * Will be extended and must be discrete from readToken.
 */
const mountEphemeralDoc = () => {
    try {
        const buffer = fs.readFileSync(localStore);
        const data = buffer.toString();
        return JSON.parse(data);        
    }
    catch (err) {
        console.log(chalk.red(`[-] A critical error occurred during mounting. See: ${err}\n`));
    }
}
/**
 * @description Depopulate local entry template and reset to defaults.
 * 
 */
const depopulate = () => {
    let ephemeralEntryTemplate = {}
    const fields = [ "deleted", "tags", "title", "subtitle", "imgsrc", "content"]
    fields.forEach(field => 
        field === "tags" ? ephemeralEntryTemplate[field] = [] : ephemeralEntryTemplate[field] = ""
        );
    persist(ephemeralEntryTemplate);
}

/**
 * @description Spawn a new shell instance and execute given command.
 *     Currently supports: osx; this operation is blocking.
 *     Command defaults to launch local entry template in given editor.
 * @param {String} cmd Command to be executed in detached shell's child process.
 */
const spawnDisparateShell = (cmd=`${editor} ${localStore}`) => {
    if (os.platform() !== "darwin") {
        return console.log(chalk.red("[-] Your operating system does not support this Feature.\n"));
    }
    const command = [
        `osascript -e 'tell application "Terminal" to activate'`, 
        `-e 'tell application "System Events" to tell process "Terminal" to keystroke "t" using command down'`, 
        `-e 'tell application "Terminal" to do script "${cmd}" in selected tab of the front window'`
    ].join(" ");
    
    const childProcess = exec(command, (err, stdout, stderr) => {
        if (err) {
            return console.log(chalk.red(`[-] Unable to spawn new process; see: ${err}\n`))
        }
    });
    childProcess.on("exit", (code) => {
        if (code !== 0) {
            return console.log(chalk.red(`[-] Process exited with status ${code}.\n`))
        }
        console.log(chalk.green("[+] Successfully updated local entry template.\n"));
    })
}

module.exports = {
    authorize,
    persist,
    readToken,
    mountEphemeralDoc,
    depopulate,
    spawnDisparateShell
}