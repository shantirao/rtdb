/*Shanti's Generic Lab Automation Manager
JavaScript objects are defined by their constructor function. By convention, constructors start
with capital letters, and everything else starts with a lower case letter.

An actuator controller has a move() function and a values[] property. The connection is a Stream.
On shutdown, close() gets called. The "this.lab" property is set by the Lab object when it attaches
to the actuator interface.

A stateless device is a stream with writeln() and readln() functions. Stateless means that it keeps
track of its own state, and the calling script talks to it without translation.
*/

debug = true

function Actuator(values,min,max)
{
 this.values = values
 this.min = min || 0
 this.max = max || 10
 this.lab = null //gets set by Lab.open()

 this.toString = function()
 {
  return this.values.toString()
 }

 this.move = function(where)
 {
   if (where.length !== this.values.length)
    throw("Invalid argument to Hexapod.move(): " + where.toSource())

   for (var i=0; i < this.values.length; i++)
   {
    if (where[i] < this.min || where[i] > this.max)
    {
     this.lab.onError(this,'Values out of range: ',where);
     return false
    }
   }

   for (var i=0; i < this.values.length; i++)
       this.values[i] = Number(where[i])

   this.lab.onChange(this)
   return true
 }

 this.save = function(state)
 {
  state.values = this.values
 }

 this.error = function()
 {
  return ""
 }

 this.pos = function()
 {
  lab.onChange(this)
  return this.values
 }

 this.help = "This is a placeholder for devices that implement the toString(), move(), save(), error(), and pos() functions"
}

function CCDH(connection)
{
 this.control = connection
 this.name = 'A4' //,'C1','C4']
 this.rba = [0,0,0,0,0,0]
 this.ssa = new Numbers(342)
 this.min = min || -.01
 this.max = max || .01
 this.lab = null //gets set by Lab.open()

 this.toString = function()
 {
  return this.name.toString()
 }

 this.home = function()
 {
    this.control.writeln('Rba_Home :PEM_' + this.name);
 }

 this.move = function(where) //[x, y, z, rx, ry, rz]
 {
   if (where.length !== this.rba.length)
    throw("Invalid argument to Hexapod.move(): " + where.toSource())

   for (var i=0; i < this.rba.length; i++)
   {
    where[i] = Number(where[i])
    if (where[i] < this.min || where[i] > this.max)
    {
     this.lab.onError(this,'Values out of range: ',where);
     return false
    }
   }

   var msg = 'Rba_Coarse_Move_Abs :PEM_' + this.name

   for (var i=0; i < this.rba.length; i++)
   {
       this.rba[i] = where[i]
       msg += ' ' + where[i].toFixed(9)
   }

   this.control.writeln(msg)

   this.lab.onChange(this)
   return true
 }

 this.shape = function(actuator, value) //[x, y, z, rx, ry, rz]
 {
  if (actuator < 0 || actuator > 341) throw "Actuator out of range"
  if (value < 0 || value > 65535) throw "Value out of range"

  this.control.writeln('Ssa_Shape_Value :PEM_' + this.name + ' ' + actuator + ' ' + value)
  this.control.writeln('Ssa_Set_Shape :PEM_' + this.name)
  this.ssa.set(actuator,value)
 }

 this.save = function(state)
 {
  state.values = {rba: this.rba, ssa: this.ssa.toString()}
 }

 this.error = function()
 {
  return ""
 }

 this.pos = function()
 {
  lab.onChange(this)
  return this.values
 }

 this.help = "This is a placeholder for devices that implement the toString(), move(), save(), error(), and pos() functions"
}
function SSA(connection, name)
{
 this.control = connection
 this.name = name || 'A4' //,'C1','C4']

 this.values = new Array(this.count)
 this.min = 0
 this.max = 65535
 this.lab = null //gets set by Lab.open()

 this.toString = function()
 {
  return this.name.toString()
 }

 this.send(cmd,args)
 {
  while (this.control.canRead) write(this.control.read(1))
  writeln('>',cmd)
  this.control.writeln("msg ifccmd xmit - - {" , cmd, " :INST_IMM :IFC_1 :PEM_" , this.name , " " , (args||"") , "}")
  while (this.control.canRead) write(this.control.read(1))
 }

 this.init = function()
 {
   this.send("SSA_Initialize_Pem")
 }

 this.start = function()
 {
   this.send("Ssa_Send_Power_On")
 }

 this.stop = function()
 {
   this.send("Ssa_Send_Power_Off")
 }

 this.home = function()
 {
 	for (let i=0; i<this.values.length; i++) this.values[i] = 32767
    this.send("Ssa_Shape_Value","0 32767") //all to midrange
    this.send("Ssa_Set_Shape")
 }

 this.move = function(where) //[x, y, z, rx, ry, rz]
 {
   if (where.length !== this.values.length)
    throw("Invalid argument to SSA.move(): " + where.toSource())

   for (let i=0; i < this.values.length && i < where.length; i++)
   {
    let x = Number(where[i])
    if (x < this.min || x > this.max)
    {
     throw this.lab.onError(this,'Value out of range: ',where[i]);
    }
   }

   for (let i=0; i < this.values.length; i++)
   {
		this.values[i] = Math.round(Number(where[i]))
		this.send("Ssa_Shape_Value",(1+i) + " " + this.values[i])
   }

   this.send("Ssa_Set_Shape")

   this.lab.onChange(this)
   return true
 }

 this.shape = function(actuator, value)
 {
  let x = Math.round(Number(value))
  if (actuator < 1 || actuator > 342) throw this.lab.onError(this,"Index out of range"+actuator)
  if (x < 0 || x > 65535) throw this.lab.onError(this,"Index out of range"+value)

  this.send('Ssa_Shape_Value',actuator + ' ' + x)
  this.send('Ssa_Set_Shape')
 }

 this.save = function(state)
 {
  state.values = {values: this.values.toSource()}
 }

 this.error = function()
 {
  return ""
 }

 this.pos = function()
 {
  lab.onChange(this)
  return this.values
 }

 this.help = "Segment shape actuators, channels 1 .. 342, values 0 .. 65535"
}

function XPS(address)
{
    this.ip = address  //192.168.131.167
    //to control multiple motor channels on the newport device
    //open a separate stream to each one, this allows them to
    //execute simultaneous actions

    this.a = new Stream("tcp://" + address + ":5001")
    this.b = new Stream("tcp://" + address + ":5001")
    this.c = new Stream("tcp://" + address + ":5001")
    this.position = [0,0,0]
    this.rangeLimit = 5
    this.rangeMax = 35

    this.a.error = ""
    this.b.error = ""
    this.c.error = ""
    this.error = function()
    {
     return {a: this.a.error, b: this.b.error, c: this.c.error}
    }

    this.save = function(state)
    {
        state.position = this.position
        state.error = this.error()
    }
//for (var i=0; i< 24; i++) c.rotate(10, 5 * Math.PI / 180, Math.PI * 2 * i / 24)

    this.test = function()
    {
        this.startup()
        this.isReady()
        this.getPosition()
        this.move(10,10,10)
        this.tilt(10,.05,-.02)
        writeln('Spin')
        for (var i=0; i< 24; i++)
        {
         this.rotate(10, 3 * Math.PI / 180, Math.PI * 2 * i / 24)
         system.sleep(1000)
        }
        writeln('Home')
        this.home()

        this.killall()
    }

    this.send = function(chan,msg)
    {
     while (chan.canRead) chan.read(512) //clear the receive buffer
     chan.write(msg)
    }

    this.readout = function(chan)
    {
//      var msg = chan.read(512);
        var t = new Stream
        chan.readUntil("EndOfAPI",t)
        var msg = t.toString()
        /*var timeout = 1000 //one second
        while (!chan.canRead && (timeout--))
        {
         system.sleep(1)
        }
        var msg=chan.read(512)
        */
        if (this.debug) writeln('XPS:',msg)

        //msg = msg.replace(/EndOfAPI.*/,'')
        var [num, val] = msg.split(',')
        if (Number(num)<0)
        {
          chan.error = msg
          lab.onError(this,msg)
        }
        return Number(val);
    }

    //initalize each actuator channel
    this.startup = function()
    {
        this.send(this.a,"GroupInitialize(GROUP1)");
        this.send(this.b,"GroupInitialize(GROUP2)");
        this.send(this.c,"GroupInitialize(GROUP3)");
        this.readout(this.a)
        this.readout(this.b)
        this.readout(this.c)
    }

    //check if channels are ready to receive commands
    this.isReady = function()
    {
        this.send(this.a,"GroupStatusGet(GROUP1,int *)");
        this.send(this.b,"GroupStatusGet(GROUP2,int *)");
        this.send(this.c,"GroupStatusGet(GROUP3,int *)");
        var status = [this.readout(this.a), this.readout(this.b),   this.readout(this.c)]
        if (this.debug) writeln(status)
        while (status.length)
        {
         let x = status.shift()
         if (x < 10 || x >= 20) return false
        }
        return true
    }

    //acquire current actuator positions
    this.getPosition = function()
    {
        this.send(this.a,"GroupPositionCurrentGet(GROUP1, double*)");
        this.send(this.b,"GroupPositionCurrentGet(GROUP2, double*)");
        this.send(this.c,"GroupPositionCurrentGet(GROUP3, double*)");
        this.position = [this.readout(this.a), this.readout(this.b), this.readout(this.c)];
        lab.onChange(this)
        return this.position
    }

    this.home = function()
    {
        this.send(this.a,"GroupHomeSearch(GROUP1)");
        this.send(this.b,"GroupHomeSearch(GROUP2)");
        this.send(this.c,"GroupHomeSearch(GROUP3)");
        this.readout(this.a)
        this.readout(this.b)
        this.readout(this.c)
        this.position = [0,0,0]
        lab.onChange(this)
    }

    this.move = function(posa, posb, posc)
    {
        if (typeof posa == "object" && posa.length == 3)
          [posa, posb, posc] = posa

        if (this.inRange(posa, posb, posc))
        {
            this.send(this.a,"GroupMoveAbsolute(GROUP1," + posa + ")")
            this.send(this.b,"GroupMoveAbsolute(GROUP2," + posb + ")")
            this.send(this.c,"GroupMoveAbsolute(GROUP3," + posc + ")")
            this.readout(this.a)
            this.readout(this.b)
            this.readout(this.c)
            this.position = [posa, posb, posc];
            return lab.onChange(this)
        }
        else
        {
            this.lab.onError(this,"Positions " + posa + ","+ posb + ","+ posc + ", exceeds range limit " + this.rangeLimit + "or extent "+this.rangeMax)
            return false
        }
    }

    this.rotate = function(piston, theta, phi)
    {
        return this.tilt(piston, theta * Math.sin(phi), -theta * Math.cos(phi))
    }

    //u, v are rotations about the x and y axis, in radians. Limit is +/-0.25. The hexapod coordinates are different
    this.tilt = function(piston, u, v)
    {
        var baseline = 20
        var s3 = Math.sqrt(3) / 2
        var da = -1 * v * baseline
        var db = (u * baseline * s3) + (v * baseline / 2)
        var dc = (-1 * u * baseline * s3) + (v * baseline / 2)
        return this.move(piston + da, piston + db, piston + dc)
    }

    this.inRange = function(x, y, z)
    {//writeln(x,y,z)
        if (x < 0 || x > this.rangeMax) return false;
        if (y < 0 || y > this.rangeMax) return false;
        if (z < 0 || z > this.rangeMax) return false;
        return ((Math.max(x,y,z) - Math.min(x,y,z)) <= this.rangeLimit)
    }

    this.killall = function()
    {
        this.send(this.a,"GroupKill(GROUP1)");
        this.send(this.b,"GroupKill(GROUP2)");
        this.send(this.c,"GroupKill(GROUP3)");
        this.readout(this.a)
        this.readout(this.b)
        this.readout(this.c)
    }
}

function Hexapod(connection)
{
 this.control = connection
 this.axes = ['X','Y','Z','U','V','W']
 this.position = [0,0,0,0,0,0]
 this.origin = [0,0,0]
 this.speed = 0
 this.debug = false
 this.response = ''
 this.active = false

 this.send = function()
 {
  if (this.debug) system.stdout.writeln.apply(system.stdout, arguments)
  this.control.writeln.apply(this.control,arguments);
 }

 this.recv = function()
 {
  var l = this.control.readln()
  if (this.debug) writeln(l)
  return l;
 }

 this.toString = function()
 {
  return this.comment
 }

 this.save = function(state)
 {
  state.position = this.position
  state.origin = this.origin
  state.speed = this.speed
  state.active = this.active
 }

 this.load = function(state)
 {
  this.home()
  this.wait()
  this.setSpeed(state.speed)
  this.pivot(state.origin)
  this.move(state.position)
  this.active = true
 }

 this.test = function()
 {
  this.home()
  this.wait()
  this.setSpeed(5)
  writeln('X limits')
    this.move([-25,0,0,0,0,0])
    writeln('\t',this.pos())
    this.move([25,0,0,0,0,0])
    writeln('\t',this.pos())
  this.setSpeed(4)
  writeln('Y limits')
    this.move([0,-25,0,0,0,0])
    writeln('\t',this.pos())
    this.move([0,25,0,0,0,0])
    writeln('\t',this.pos())
  this.setSpeed(3)
  writeln('Z limits')
    this.move([0,0,-25,0,0,0])
    writeln('\t',this.pos())
    this.move([0,0,25,0,0,0])
    writeln('\t',this.pos())
  this.setSpeed(2)
  writeln('U limits')
    this.move([0,0,0,-5,0,0])
    writeln('\t',this.pos())
    this.move([0,0,0,5,0,0])
    writeln('\t',this.pos())
  this.setSpeed(1)
  writeln('V limits')
    this.move([0,0,0,0,-5,0])
    writeln('\t',this.pos())
    this.move([0,0,0,0,5,0])
    writeln('\t',this.pos())
  this.setSpeed(5)
  writeln('W limits')
    this.move([0,0,0,0,0,-7.5])
    writeln('\t',this.pos())
    this.move([0,0,0,0,0,7.5])
    writeln('\t',this.pos())
  this.setSpeed(3)
  writeln('Strut limits')
    this.move([10,10,5,4,2,-2])
    writeln('\t',this.pos())
    this.move([-10,-10,-5,-4,-2,2])
    writeln('\t',this.pos())
  writeln('Home')
  this.home()
  writeln('Pivot')
  this.pivot([0,0,-62]) //set the virtual pivot position
    for (var i=-5; i< 5; i++)
    {
      this.move([0,0,0,i,0,0])
      this.wait()
    }
    for (var i=-5; i< 5; i++)
    {
      this.move([0,0,0,0,i,0])
      this.wait()
    }
  this.setSpeed(4)
  writeln('Spin')
    for (var i=0; i< 24; i++)
    {
     this.rotate(5 * Math.PI / 180, Math.PI * 2 * i / 24)
     writeln('\t',this.pos())
    }
  writeln('Safing')
    this.safe()
    this.wait()
    writeln('\t',this.pos())
 }

 this.safe = function()
 {
   //this.move([0,0,-25,0,0,0])
   this.send("MOV X0 Y0 Z-25 U0 V0 W0")
   this.wait()
   this.active = false
   this.send('POS?')
     let values = []
     for (var i=0; i<this.axes.length; i++)
     {
      let l = this.recv()
      let [a, v] = l.split('=')
      if (a != this.axes[i]) throw ("Axis mismatch in POS? " + l + ':' + i)
      values[i] = Number(v)
      }
   return values;
 }

 //Starts a move. Call wait() afterwards before acquiring images.
 //'where' is an array of up to 6 numbers. The internal 'position' array will be updated.
 this.move = function(where)
 {
  if (where.length !== this.axes.length)
   throw("Invalid argument to Hexapod.move(): " + where.toSource())

  var msg = 'MOV'
  for (var i=0; i < this.axes.length; i++)
  {
    if (this.position !== where) //no need to copy if the objects are already equivalent
      this.position[i] = Number(where[i])
    msg += ' ' + this.axes[i] + this.position[i].toFixed(6)
  }

  this.send(msg);
  return lab.onChange(this)
 }

 //Pump any pending messages and then poll the error register.
 this.error = function()
 {
  this.response = ''
  while (this.control.canRead)
   this.response += this.recv()
  this.send('ERR?')
  this.response += this.recv()
  return this.response
 }

 this.pos = function()
 {
  this.send('POS?')
  let values = []
  for (var i=0; i<this.axes.length; i++)
  {
   let l = this.recv()
   let [a, v] = l.split('=')
   if (a != this.axes[i]) throw ("Axis mismatch in POS? " + l + ':' + i)
   values[i] = Number(v)
  }
  this.position = values
  this.active = true
  return this.position
 }

 this.getSpeed = function(f)
 {
  this.send('VEL?')
  this.speed = Number(this.recv())
  return this.speed
 }

 this.setSpeed = function(f)
 {
  if (f && typeof f =='number')
  this.send('VEL ',f.toFixed(6))
  this.getSpeed()
  lab.onChange(this)
  return this.speed
 }

 //Wait until a move is complete.
 this.wait = function()
 {
  this.send('MOV?')

  var line = ''
  var timeout = 10000
  while (timeout-- && line[0] != '1' && this.control.canWrite)
  {
   if (!this.control.canRead) //check for not closed
   { system.sleep(100)
     if (this.debug) write('.')
   }
   else
    line = this.recv(10)
  }
  this.response = line
  return line[0] == '1'
 }

 this.stop = function()
 {
  this.control.write('\33') //ESC is emergency stop
 }

 this.getPivot = function()
 {
   var labels = ['R','S','T']
   this.send('SPI?')
   for (var i=0; i<this.origin.length; i++)
   {
    let [a, v] = this.recv().split('=')
    if (a != labels[i]) throw ("Axis mismatch in SPI? " + a)
    this.origin[i] = Number(v)
   }
   return this.origin
 }

 this.pivot = function(where)
 {
  if (where.length !== this.origin.length)
   throw("Invalid argument to Hexapod.pivot(): " + where.toSource())

  if (this.position[3] != 0.0 || this.position[4] != 0.0 || this.position[5] != 0.0)
   throw("Hexapod must be level before chaging the pivot point")

  this.send('SPI R',where[0],' S',where[1],' T',where[2])
  this.getPivot()
  return lab.onChange(this)
 }

 this.home = function()
 {
  this.send('INI')
  this.pos()
 }
 //this.send('INI')
 this.send('*IDN?')
 this.comment = this.recv()
 this.getPivot()
 this.pos()
 this.getSpeed()

 //Theta is the angle from normal, phi is the orbit.
 this.rotate = function(theta,phi)
 {
  function sign(x) {return x<0?-1:1}
  function sq(x) {return x*x}

  var u = sign(theta) * sign(Math.sin(phi)) * Math.acos(Math.sqrt(sq(Math.cos(theta))/(1-(sq(Math.cos(phi)) * sq(Math.sin(theta)) ) ) ) )
  var v = sign(theta) * sign(-1*Math.cos(phi)) * Math.acos(Math.sqrt((1-(sq(Math.cos(phi)) * sq(Math.sin(theta)) ) )))
  u *= 180 / Math.PI
  v *= 180 / Math.PI
  this.position[3] = u
  this.position[4] = v
  this.move(this.position)
 }

 this.help = "The hexapod rotates in degrees about the X, Y, and Z axes after translating. For W=0 rotations, the rotated axes become " +
 "X' = [cos(V), -sin(U) * sin(V), cos(U) * sin(V)], Y' = [0, cos(U), sin(U)], Z' = [-sin(V), -cos(V) * sin(U), cos(U) * cos(V)]. " +
 "To convert back, U = +/- acos(sqrt(cos(theta)^2/(-cos(phi)^2 * sin(theta)^2 + 1))), "+
 "V = +/- acos(sqrt(-cos(phi)^2 * sin(theta)^2 + 1)) " +
 "where [X, Y, Z] = [sin(theta) * cos(phi), sin(theta) * sin(phi), -cos(theta)]."
}

//This is an object for accessing part of an actuator's values array.
//We use it to isolate rotation from translation.
function Subset(lab,device,start,length)
{
 this.lab = lab;
 this.parent = lab.open(device);
 this.start = start
 this.end = start + length
 this.move = function(values)
 {
  var j = 0;
  for (var i = this.start; i < this.end; i++)
  {
   this.parent.values[i] = Number(values[j++]);
   if (this.parent.values[i] < this.parent.min) this.parent.values[i] = this.parent.min;
   if (this.parent.values[i] > this.parent.max) this.parent.values[i] = this.parent.max;
  }
  this.parent.move(this.parent.values);
 }
 this.close = function()
 {
 }
}

//For devices controlled with HTTP GET
function Remote(address,cmd)
{
 this.control = address; // 'http://192.168.0.1/'
 this.cmd = cmd;
 this.debug = false;
 this._resp = []
 this.min = min
 this.max = max

 this.values = ''

 this.move = function(x)
 {
  this.values = x.toString()
  var y = this.cmd + this.values;
  if (this.debug) writeln(this.control + encodeURL(y))
  var s = new Stream(this.control + encodeURL(x)) // http://192.168.0.1/program.cgi?value1,value2,value3,...
  var m = s.readMIME();
  var l = Number(m.get("Content-length"));
  if (l) this._resp.push(s.read(l));
  s.close()
 }

 this.save = function(state)
 {
  state.values = this.values
 }
}


function Lab(devices)
{
    if (Lab.singleton)
    {
     Lab.singleton.useCount++
     return Lab.singleton
    }
    else
    {
     Lab.singleton = this;
    }

    this.devices = devices;
    this.useCount = 1;
    this.state = null;
    this.loadState();

    this.time = new Date;
    this.directory = 'c:/data/' + this.time.toLocaleFormat('%Y%m%d') + '/';
    if (!system.exists(this.directory + 'readme.txt'))
    {
        //writeln(this.directory)
        system.mkdir(this.directory)
        s = new Stream(this.directory + 'readme.txt','at')
        s.close()
    }

    this.log = this.open('log')
}


/* raw writes are not used in AMD
Lab.prototype.send = function(name,value)
{
 var d = this.find(name);
 if (!d.obj) {this.open(name);d = this.find(name);}
 if (!d.obj) throw "Device " + name + " is not open";
 d.obj.writeln(value)
}
*/

Lab.prototype.toString = function()
{var s = '';
 for (var i in this.devices)
 {
  s += (this.devices[i].name+'\t'+(this.devices[i].obj != null ? '1  ' : '0 ')+'\t'+this.devices[i].comment);
  if (this.devices[i].obj) s += '\t[' + this.devices[i].obj.toString() + ']';
  s += '\n'
 }
 return s;
}

Lab.prototype.name = function(obj)
{
 for each (var d in this.devices)
   if (d.obj === obj) return d.name;

 return null;
}

Lab.prototype.find = function(name)
{
 for each (var d in this.devices)
   if (d.name == name) return d;

 return null;
}

Lab.prototype.open = function(name)
{
 var d = this.find(name)
 var ret = null
 if (d == null) return null
 if (d.obj != null) ret = d.obj

 //maybe it's already running
 if (!ret)
 {
     try {
     if (d.connect)
     {
      d.obj = d.connect(this);
      d.lab = this;
      ret = d.obj;
     }
     } catch(x) {}
 }
 if (!ret && d.program)
 {
   system.execute(d.program,d.parameters.replace(/\$data/,this.directory));
   system.sleep(500)
 }
 if (!ret)
 {
     try {
      if (d.connect)
      {
       d.obj = d.connect(this);
       d.lab = this;
       ret = d.obj;
      }
      } catch(x)
      {
       writeln("Error connecting to "+name);
       writeln(x)
      }
 }

 if (ret && typeof (this.state[name]) == "undefined")
      this.state[name] = {}

 this.writeLog(name,this.state[name].toSource())

 ret.lab = this
 return ret;
}

//when a device function is called that changes its state, it notifies the lab manager, which logs the new state
Lab.prototype.onChange = function(obj)
{
 var name = this.name(obj)
 if (name && typeof obj.save == "function")
 {
   obj.save(this.state[name])
   this.writeLog(name,this.state[name].toSource())
   return true
 }
 return false
}

Lab.prototype.onError = function(obj,message)
{
 var name = this.name(obj)
 writeln(name,':',message)
 this.state.error={source:name,message:message,time:new Date().toString()}
 this.writeLog("error",this.state.error.toSource())
 return message
}

Lab.prototype.loadState = function()
{
 if (system.exists('state.dat'))
 {
  var f = new Stream('state.dat');
  var a = f.read(f.size)
  this.state = eval(a);
  f.close();
 }
 else
 {
  this.state = {}
 }
}

Lab.prototype.writeLog = function(channel,message,time)
{
 if (!time) time = (new Date()).toLocaleFormat('%H%M%S')
 if (!this.log) 
{
 var f = new Stream(this.directory+'log.txt','at');
 f.writeln(time,' ',channel,': ',message);
 f.close();
return;
}
 this.log.writeln('insert ', channel,' ',message.length,' 0 ',time)
 this.log.write(message)
 this.log.readln()
}

Lab.prototype.saveState = function(all)
{
 if (all)
   for each (var d in devices)
     if (typeof d.obj.save == 'function')
       d.obj.save(this.state[d.name])

 var f = new Stream('state.dat','wt');
 f.writeln(this.state.toSource());
 f.close()
}

Lab.prototype.getFileName = function(prefix, extension)
{
 var fn = ''
 var suffix = 0
 while (true)
  {
   fn = prefix + (new Date()).toLocaleFormat('%H%M%S')   + '_' + suffix + extension
   if (!system.exists(this.directory + fn))
     return this.directory + fn
   suffix++
  }
}

Lab.prototype.note = function(message)
{
 var hdr = (new Date()).toLocaleFormat('%H%M%S')
 var msg = new Stream(this.directory + 'readme.txt','at')
 msg.write(hdr,': ')
 var l = ''

 for (var i=0; i<arguments.length; i++)
  {
   if (i)
   {
    msg.write(' ')
    write(' ')
    l += ' '
   }
   msg.write(arguments[i])
   write(arguments[i])
   l += arguments[i].toString()
 }
 this.writeLog('note',l,hdr)
 msg.writeln()
 writeln()
 msg.close()
}

Lab.prototype.close = function()
{
 this.useCount--;
 if (this.useCount > 0) return false

 this.saveState(true)

 for (var i in this.devices)
   {
    var d = this.devices[i]
    if (!d.obj || typeof d.obj.close != 'function') continue;
    d.obj.close()
    d.obj = null
   }
 return true
}

/*
Ports
90 Keithley frequency generator
92 Flexcam
96 Keithley daq
140 rtdb
160 rtdb
10001 test-hexapod
40000 CCDH
*/
//Create a global object to interface with the lab equipment
lab = new Lab(
[
//{obj: null, name: 'log', program: 'rtdb.exe', parameters: '$data', connect: function() {return new Stream('tcp://localhost:160')}, comment: 'Real-time database'},
{obj: null, name: 'hexapod', program: '', connect: function() {return new Hexapod(new Stream('tcp://192.168.131.166:10001'))}, comment: 'PI Hexapod'},
//{obj: null, name: 'test-hexapod', program: 'jsdb.exe', parameters: 'testhexapod.js 10001 testhexapod.txt', connect: function() {return new Hexapod(new Stream('tcp://127.0.0.1:10001'))}, comment: 'PI Hexapod'},
{obj: null, name: 'origin', program: '', connect: function(lab) {return new Subset(lab,'hexapod',0,3);}, comment:'Hexapod X,Y,Z'},
{obj: null, name: 'angle', program: '', connect: function(lab) {return new Subset(lab,'hexapod',3,3);}, comment:'Hexapod U,V,W'},
//{obj: null, name: 'cgh', program: '', connect: function() {return new XPS("192.168.131.167")}, comment: 'Newport XPS A,B,C'},
//{obj: null, name: 'm1ssa', program: '', connect: function() {return new SSA(new Stream('tcp://192.168.131.1:40000'),'A4')}, comment: 'Primary mirror'},
//{obj: null, name: 'accels', program: '../keithley/scope.exe -server 96 -channels "0,1,2,3,4,5,6,7,8,9,10,11,12" -gains "8,8,8,8,8,8,8,8,8,8,8,8,1"', connect: function() {return new Stream('tcp://127.0.0.1:96')}, comment: 'Accelerometers'},
]);
