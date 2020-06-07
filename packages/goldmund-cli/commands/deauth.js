#!/usr/bin/env node
const chalk = require("chalk");
const { authorize, readToken, persist } = require("../utils/fs.js");
const { logout } = require("../utils/requests.js");

/**
 * @description Command handler. Nullifies session on issuing authority and destroys local artifact thereof.
 */
const destroyAuth = async () => {
    try {
        const { token } = readToken();
        if (!token || token === "") {
            throw new Error("[-] Unable to find local session.\n");
            
        }
        let response = logout(token);
        if (!response || token === "") {
            throw new Error("[-] Unable to destroy local session.\n");
        }
        else {
            let ephemeralEntryTemplate = {}
            const fields = [ "deleted", "tags", "title", "subtitle", "imgsrc", "content"]
            fields.forEach(field => 
                field === "tags" ? ephemeralEntryTemplate[field] = [] : ephemeralEntryTemplate[field] = ""
                );
            // depopulate local tempfile
            persist(ephemeralEntryTemplate);
            console.log(chalk.green("[+] Successfully cleared entry template.\n"));
            // destroy local token
            authorize({ token: "" });
            console.log(chalk.green("[+] Successfully destroyed current session.\n"));
        }
    } catch(err) {
        console.log(chalk.red(err));
    }
}

exports.command = "deauth"
exports.desc = "Destroy current session"
exports.handler = () => {
    destroyAuth();
}