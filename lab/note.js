load('lab.js');

var filename = lab.directory+'readme.txt';
if (system.arguments.length)
{
 var file = new Stream(filename ,'at');
 file.writeln((new Date()).toLocaleFormat('%H%M%S'),': ',system.arguments.join(' '));
 file.close();
}
else
{
 var file = new Stream(filename ,'rt');
 system.stdout.append(file);
 file.close();
}