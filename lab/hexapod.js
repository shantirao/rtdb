load('lab.js')

hexapod = lab.open('hexapod')
lab.writeLog('command',system.arguments.join(' '));
if (hexapod == null) throw("Invalid device")

function position()
{
  var p = hexapod.pos()
  for each (let n in p) write(n.toFixed(6),' ')
  writeln()
}
function pivot()
{
  var p = hexapod.getPivot()
  for each (let n in p) write(n.toFixed(6),' ')
  writeln()
}

if (system.arguments.length == 0)
{
  writeln('usage: hexapod move x y z      x, y, z are positions in mm')
  writeln('               tilt u v w      u, v, w are angles in degrees')
  writeln('               +/-z            +/- z is a delta in mm')
  writeln('               pivot x y z     set the pivot point')
  writeln('               home            reset to 0, 0, 0, 0, 0, 0')
  writeln('               startup         return to last-known-good position')
  writeln('               reset           home, and reset pivot point')
  writeln('               stop            stop motion')
  writeln('               speed s         set velocity')
  writeln('               speed           query velocity')
  writeln('               move            query position')
  writeln('               pivot           query pivot point') 
  writeln('               retract         manually pull down 1 rotation at a time')
  writeln('               safe            secure for power-down') 
  writeln(hexapod.comment)
  writeln(hexapod.error())
}
else if (system.arguments[0] == 'startup')
{
  var pos = lab.state.hexapod.position
  var pivot = lab.state.hexapod.origin
  hexapod.home()
  hexapod.pivot(pivot)
  hexapod.move(pos)  
  hexapod.wait()
  position()
  writeln("Ready")
}
else if (system.arguments[0] == 'safe')
{
  var p = hexapod.safe() //hexapod.move([0,0,-25,0,0,0])
  for each (let n in p) write(n.toFixed(6),' ')
  writeln(p.active ? "Error" : "Secure")
  writeln()
}
else if (system.arguments[0] == 'reset')
{
  hexapod.move([0,0,0,0,0,0])
  hexapod.wait()
  hexapod.pivot([0,0,0])
  position()
  writeln("Ready")
}
else if (system.arguments[0] == 'home')
{
  hexapod.home()
  writeln("Ready")
}
else if (system.arguments[0] == 'speed')
{
 if (system.arguments.length > 1)
 hexapod.setSpeed(Number(system.arguments[1]))
  
 writeln(hexapod.speed)
  writeln("Ready")
}
else if (system.arguments[0] == 'move')
{
 if (system.arguments.length == 1)
 {
  position()
  writeln("Ready")
 }
 else if (system.arguments.length == 4)
 {
  var v = hexapod.position.slice()
  for (var i=0; i<3; i++) v[i] = Number(system.arguments[i+1])
  hexapod.move(v)
  position()
  writeln("Ready")
 }
 else if (system.arguments.length == 7)
 {
  hexapod.move(system.arguments.slice(1))
  position()
  writeln("Ready")
 }
 else writeln('Invalid arguments')
}
else if (system.arguments[0] == 'tilt')
{
 if (system.arguments.length == 1)
 {
  position()
  writeln("Ready")
 }
 else if (system.arguments.length == 4)
 {
  var v = hexapod.position.slice()
  for (var i=0; i<3; i++) v[i+3] = Number(system.arguments[i+1])
  hexapod.move(v)
  position()
  writeln("Ready")
 }
 else writeln('Invalid arguments')
}
else if (system.arguments[0][0] == '-' || system.arguments[0][0] == '+')
{
 var v = hexapod.position.slice()
 v[2] += Number(system.arguments[0])
 hexapod.move(v)
 hexapod.wait()
 position()
  writeln("Ready")
}
else if (system.arguments[0] == 'pivot')
{
 var old = hexapod.pos().slice(0)
 if (system.arguments.length >= 4)
 {
  hexapod.move([old[0],old[1],old[2],0,0,0])
  hexapod.pos()
  hexapod.pivot(system.arguments.slice(1))
  hexapod.pos()
  hexapod.move(old)
 }
 pivot() 
  writeln("Ready")
}
else if (system.arguments[0] == 'retract')
{
/* paste this into a telnet window
drv l3 -1
err?
drv l4 -1
err?
drv l6 -1
err?
drv l2 -1
err?
drv l5 -1
err?
drv l1 -1
err?
*/
throw "this doesn't seem to work automatically. read the source code for workaround"
var dt = 5500;
  hexapod.control.writeln('SVO x 1');
writeln('l6 -1')
  hexapod.control.writeln('drv l6 -1');
system.sleep(dt);
writeln('l5 -1')
  hexapod.control.writeln('drv l5 -1');
system.sleep(dt);
writeln('l4 -1')
  hexapod.control.writeln('drv l4 -1');
system.sleep(dt);
writeln('l3 -1')
  hexapod.control.writeln('drv l3 -1');
system.sleep(dt);
writeln('l2 -1')
  hexapod.control.writeln('drv l2 -1');
system.sleep(dt);
writeln('l1 -1')
  hexapod.control.writeln('drv l1 -1');
system.sleep(dt);
}
else
{
 writeln("Unknown command: ",system.arguments)
}

lab.saveState()
