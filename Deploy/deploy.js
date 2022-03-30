function readContractCodeByPath (fullContractPath, ext = '.scilla')
{
    const { sep, resolve } = require('path');
    const { existsSync, readFileSync } = require('fs');
    if (!existsSync(fullContractPath)) {
        throw new Error('Contract not found at path: ' + fullContractPath);
    }
    return readFileSync(fullContractPath).toString();
}
