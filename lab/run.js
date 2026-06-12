load('httpd.js')
var server = new HTTPD();

server.debug = false

server.hosts = ['shanti-portable','localhost','4DA56','OGSE0'] //restrict access

//enable programs executed as separate processes
server.handlers["cgi"] = execCGI 

//enable server-parsed JavaScript pages 
server.handlers["jsp"] = execJSP 

//server config
server.forbidden = ['httpd.js','cgi.js','run.js','lab.js']
server.index = "Index.html"

server.functions["echo"] = function(client,data)
{
   client.writeln("Content-type: text/plain")
   client.writeln()
   client.writeln(data.toSource())
}

/*
//intended to be called by AJAX
server.functions["state"] = function(client,data)
{
   client.writeln("Content-type: text/plain")
   client.writeln()
   client.writeln(lab.state.toSource())
}

//?note=message
server.functions["note"] = function(client,data)
{
   client.writeln("Content-type: text/plain")
   client.writeln()
   lab.note(data.note)
   client.writeln(true)
}

//?device=d&function=f&params=[p1, p2, p3, ...]
server.functions["rpc"] = function(client,data) 
{
   client.writeln("Content-type: text/plain")
   client.writeln()
   var device = lab.open(data.device)
   if (device)
   {
	   var fn = device[data['function']]
	   if (typeof fn == 'function')
	   {
		var params = data.params
		client.writeln(fn.apply(device,params))
		return;
	   }
	   client.writeln('Error: unknown function name ',data.toSource())	   
   }
}
*/

server.functions["exec"] = function(client) 
{
  if (client.query.length)
   {
    try 
    { 	
	 var cmd = decodeURI(client.query);
     var src = new Stream('exec://jsdb.exe ' + cmd);
     writeln(src)
	 var result = '';
	 while (!src.eof)
	 {
	  if (src.canRead)
	  {
	   var l = src.read(1)
	   write(l)
	   result+= l;
	  }
	  else system.sleep(10)
	 }
	 writeln()
	 result = result.replace(/\r\n/g,'\n')
	 //result = result.replace(/\n/g,'<br>')
     client.writeln("Content-type: text/plain");
	 client.writeln("Content-length: ", result.length);
	 client.writeln();
	 client.write(result);
 	 src.close()
    } 
    catch(err)
    {
     writeln("Error: ",err);
     for (var i in err) writeln(i,': ',err[i])
     client.writeln("Error: ",err);
    }
   }
}

writeln('starting')
server.run(8080,system.arguments.length? system.arguments.shift() : true);
delete server;

