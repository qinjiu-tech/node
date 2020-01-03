'use strict';

module.exports = {
    module: 'different_version/server/action/different-version-controller',
    routes: [{
        'method': 'get',
        'path': '/rest/different_versions',
        'handler': 'getAllVersions',
        'passport': {
            'needLogin': true
        },
        'privileges': []
    },{
        'method': 'get',
        'path': '/rest/different_version/functions',
        'handler': 'getVersionFunctionsById',
        'passport': {
            'needLogin': true
        },
        'privileges': []
    }]
};

