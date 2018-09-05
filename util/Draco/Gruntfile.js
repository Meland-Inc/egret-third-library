var grunt = require("grunt");
grunt.config.init({
    pkg: grunt.file.readJSON('package.json'),
    'create-windows-installer': {
        x64: {
            appDirectory: './build/Draco-win32-x64',
            authors: 'blood',
            exe: 'Draco.exe',
            description: "Draco",
        }
    }
})

grunt.loadNpmTasks('grunt-electron-installer');
grunt.registerTask('default', ['create-windows-installer']);