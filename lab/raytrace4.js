// shape has vertex and local coordinates and a surface definition
// sphere: center or vertex (center along +w)

// dimensions in m

// 2d geometry
function Circle(params, center)
{
 if (typeof params === 'object')
 {
  this.radius = params.radius;
  this.center = params.center || [0,0];
 }
 else
 {
  this.radius = params;
  this.center = center || [0,0];
 }
 this.r2 = this.radius*this.radius;
}

/// outer limits of shape, in local coordinate system [umin umax vmin vmax]
Circle.prototype.range = function()
{
 return [-this.radius, this.radius, -this.radius, this.radius]
}

Circle.prototype.toSource = function()
{
  return "new Circle"+({radius:this.radius, center:this.center}).toSource();
}

Circle.prototype.inside = function(u,v)
{
  u = u - this.center[0];
  v = v - this.center[1];
  return (u*u + v*v) < this.r2;
}

function Plane(params)
{
}

Plane.prototype.toSource = function()
{
  return "new Plane()";
}

Plane.prototype.elevation = function(u,v)
{
  return 0;
};

Plane.prototype.normal = function(u,v)
{
  return [0,0,1];
};

// 3d geometry

// k=0 sphere
// k=-1 parabola
// k<-1 hyperbola
// k>-1 ellipse
// R = Radius of curvature
// c = 1/R (use R or C (preferred) )
// A = 4th order and higher aspheric terms
function Conic(params)
{
  this.k=params.k;
  this.R=params.R || 1/params.C;
  this.C=params.C || 1/params.R;
  this.A=params.A;
}

Conic.prototype.toSource = function()
{
  return "new Conic"+({k:this.k,c:this.c,A:this.A}).toSource();
}

Conic.prototype.elevation = function(u,v)
{
  var s2 = u*u+v*v;
  var z = this.C*s2;
  if (this.k == -1)
	z = z/2;
  else
	z = z/(1+Math.sqrt(1-((1+this.k)*this.C*this.C*s2)));

  if (this.A)
  {
	var sn = s2;
	for (var i=0;i<this.A.length;i++)
	{
		sn = sn * s2;
		z = z + this.A[i]*sn;
	}
  }
  return z;
};

Conic.prototype.normal = function(u,v)
{
  var s2 = u*u + v*v;
  var d = this.C/Math.sqrt(1-this.C*this.C*(1+this.k)*s2);
  if (this.A)
  {
	var sn = 1;
	var f = 2;
	for (var i=0;i<this.A.length;i++)
	{
			sn = sn * s2;
			f = f + 2;
			d = d + f*this.A[i]*sn;
	}
  }
  return [-u*d,-v*d,1];
};

function vcross(a,b)
{
 return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
}

function vnorm(a)
{
 return vscale(a,1/Math.sqrt(vdot(a,a)));
}

function vdot(a,b)
{
 var c=0;
 for (var i=0; i<3; i++) if (a[i]!=0&&b[i]!=0) c+=a[i]*b[i];
 return c;
}

function vmean(list)
{
 var c=list[0].slice();
 var n = c.length;
 for (var j = 1; j < list.length; j++)
 {
 	var b = list[j];
    for (var i=0; i<n; i++)
       c[i]+=b[i];
 }

 for (var i=0; i<n; i++)
       c[i] /= list.length;
 return c;

}

function vadd(a)
{
 var c=a.slice();
 for (var j = 1; j < arguments.length; j++)
 {
 	var b = arguments[j];
    for (var i=0; i<3; i++)
       c[i]+=b[i];
 }
 return c;
}

function vsub(a,b)
{
 var c=[0,0,0];
 for (var i=0; i<3; i++) c[i]=a[i]-b[i];
 return c;
}

function vscale(a,b)
{
 var c=[0,0,0];
 for (var i=0; i<3; i++) c[i]=a[i]*b;
 return c;
}

function conicRSI(vertex,normal,shape,origin,direction)
{
  var rN = vdot(direction,normal);
  var P = vsub(origin,vertex);
  var NP = vdot(P,normal);
  var rP = vdot(P,direction);
  var k = shape.k;
  var R = shape.R;
  var a = vdot(direction,direction)+k*rN*rN;
  var b = (R-K*NP)*rN - rP; //-b in the quadratic equation
  var c = vdot(P,P)+NP*(K*NP-2*R);
  var w = b*b+a+c;
  if (w < 0) // no intersection
     return null;
  w = Math.sqrt(w);
  var l1 = (b + w)/a;
  var l2 = (b - w)/a;
  // return the point closest to the tangent plane
  // not behind the ray origin
}

function toPlane(vertex,normal,origin,direction)
{
  var d = direction||normal;
  var distance = vdot(vsub(vertex,origin),normal) / vdot(normal,d);
  var p = vadd(origin,vscale(d,distance));
  return [distance, p];
}
/*
function rayToPlane(surface,ray)
{
  var distance = vdot(vsub(surface.vertex,ray.origin),surface.normal) / vdot(surface.normal,ray.direction);
  var p = vadd(ray.origin,vscale(ray.direction,distance));
  return [distance, p];
}

function pointToPlane(surface,p)
{
 //return rayToPlane(surface,{vertex:p,direction:surface.normal});
 return toPlane(surface,p);
}
*/
function pointToLocal(surface,p)
{
  var x = vsub(p,surface.vertex);
  var u = vdot(surface.u,x);
  var v = vdot(surface.v,x);
  return [u,v];
}

function intersection(surface,origin,direction)
{
const tolerance = 1e-9 * 1e-9; // 1nm^2
const niter = 10;

  // project the ray onto the surface's u,v plane
  var [distance, p] = toPlane(surface.vertex,surface.normal,origin,direction);

  var [u, v] = pointToLocal(surface,p);

  var z = surface.shape.elevation(u,v);

  // back to global coordinates

  var p1 = vadd(surface.vertex,vscale(surface.normal,z),vscale(surface.u,u),vscale(surface.v,v))
  var n1 = surface.shape.normal(u,v);
  var errest = 0;
  var p2;
  var n2;
  // iterate improvement

  for (var i=0; i<niter; i++)
  {
	[distance,p] = toPlane(p1,n1,origin,direction);
	[u, v] = pointToLocal(surface,p);
	z = surface.shape.elevation(u,v);
	p2 = vadd(surface.vertex,vscale(surface.normal,z),vscale(surface.u,u),vscale(surface.v,v))
	n2 = surface.shape.normal(u,v);

	errest = vsub(p1,p2);
	errest = vdot(errest,errest);
	if (errest < tolerance) break;
	p1 = p2;
	n1 = n2;
  }

  // [intersection position, surface normal, distance along ray, local [u,v], error estimate]
  return [p2, vnorm(n2), distance, u,v, errest];
}

//angle of incidence = angle of reflection
function reflect(ray, normal)
{
  return vsub(ray,vscale(normal,2*vdot(normal,ray)));
}

/* calculate a new ray direction, given incident and exit indices
ray: incident ray direction, not necessarily normalized
normal: surface normal direction, normalized?
ni: incident ray index
ni2: incident ray index, squared
ne2: exit ray index, squared

refract() returns an exit ray whose length is n_e, or null in case of TIR
if refract() returns null, call reflect() to get the TIR wave

note: ray and normal don't have to be normalized,
n*(N*r) = n*cos(Theta), Theta = angle from normal

Snell's law is equivalent to saying that the wavefronts are continuous across a boundary.

This isn't as computationally efficient as OSML's, but ray and normal are not assumed to
be normalized, so it should work better with a sloppy geometry engine.

The computation error of the exit ray angle is about 2e-16 for a 100 nrad incidence angle difference,
just in case you were wondering. Which is a micron or so displacement error if you are trying to resolve
a soccer ball on the moon. Not worth further consideration: double precision is good enough.
*/

if (!('sign' in Math)) Math.sign = function(x) {return x<0?-1:x>0?1:0;}

function refract(ray, normal, ni2, ne2)
{
 var np = vdot(normal,ray); // cos(Theta_i) * length(ray)
 var s = Math.sign(np);
 var r2 = vdot(ray,ray)
 var n2 = vdot(normal,normal)
 var np2 = np * np /( r2 * n2);//cos(Theta_i)^2
 var TIR = ne2 - ni2 + ni2*np2;
 if (TIR < 0.0) // critical angle rays will evaluate to be perpendicular to the normal
 {
  return null;
 }
 var n1 = Math.sqrt(ni2/r2) // ni / length(ray)

 return vadd(vscale(ray,n1),vscale(normal,-vdot(normal,ray)*n1/n2+s*Math.sqrt(TIR/n2)))
}

/* refractFast requires norm(ray) = n_i and norm(normal) = 1.0

*/

function refractFast(ray, normal, ni2, ne2)
{
 var np = vdot(normal,ray); // cos(Theta_i) * length(ray)
 var s = Math.sign(np);
 var np2 = np * np;//cos(Theta_i)^2
 var TIR = ne2 - ni2 + np2;
 if (TIR < 0.0) // critical angle rays will evaluate to be perpendicular to the normal
 {
  return null;
 }
 return vadd(ray,vscale(normal,s*Math.sqrt(TIR) - np))
}

function inBoundary(surface,u,v)
{
 if (surface.boundary)
 	 {
 	  if (surface.boundary.exclude && surface.boundary.exclude.inside(u,v))
 	  	return false;

 	  if (surface.boundary.include && !surface.boundary.include.inside(u,v))
 	  	return false;
    }
 return true;
}

function propagate(bundle, surface)
{
 var reflection = [];
 var bounce = []
 var ray;
 var p, n, d;
 var r;

 for (var i=0;i<bundle.length;i++)
 {
    ray = bundle[i];
    if (!ray.active) continue;

    [p,n,d,u,v] = intersection(surface,ray.origin,ray.direction);

    if (!inBoundary(surface,u,v))
       { ray.active = false; continue; }

    ray.distance = d;
    ray.destination = p;
    r = {origin:p, direction:reflect(ray.direction,n), active: true};
    if ('color' in ray)
    	r.color = ray.color
    reflection.push(r);
    bounce.push({incident:ray, normal:n, reflected:r});
 }
 return [reflection, bounce];
}

function boundaryCube(bundle, oldBoundary)
{
 min = bundle[0].origin.slice();
 max = bundle[0].origin.slice();
 if (oldBoundary)
 {
  min = oldBoundary[0]
  max = oldBoundary[1]
 }

 var j;
 for (var i=0; i<bundle.length; i++)
 {
   var r = bundle[i];
   if (!r.active) continue;
   var a = r.origin;
   var b = r.destination || a;
   for (j=0; j<3; j++)
   {
	   if (a[j] < min[j]) min[j] = a[j];
	   if (a[j] > max[j]) max[j] = a[j];
	   if (b[j] < min[j]) min[j] = b[j];
	   if (b[j] > max[j]) max[j] = b[j];
   }
 }
 return [min,max];
}

//returns grid points in local [u,v] coordinates, relative to the vertex
function Grid(N)
{
	this.points = [];
	this.N = N || 101;
}

Grid.prototype.generate = function(surface,range)
{
	this.points = [];
	var range;

	if (this.N<2) this.N = 2;

	var N1 = this.N-1;
	var ru = (range[1]-range[0]);
	var rv = (range[3]-range[2]);
	var i,j
	for (i=0; i<this.N; i++)
		for (j=0; j<this.N; j++)
			this.points.push([ range[0] + ru*i/N1, range[2] + rv*j/N1]);
}

Grid.prototype.toSource = function()
{
 return 'new Grid('+this.N+')'
}

function HexGrid(N)
{
	this.points = [];
	this.N = N || 101;
}

HexGrid.prototype.generate = function(surface,range)
{
	this.points = [];

	if (this.N<2) this.N = 2;

	var N1 = this.N-1;
	var ru = (range[1]-range[0]);
	var du = ru/(this.N-1);
	var dv = du * Math.sqrt(3)/2;
	var v = 0;
	var i=0,j=0,x=0;
	for (v=range[2]; v<=range[3]; i++, v += dv)
	{
		x = (i%2)*du/2;
		for (j=i%2; j<this.N; j++)
			this.points.push([ range[0] + x + ru*j/N1, range[2] + (dv*(i++))]);
	}
}

HexGrid.prototype.toSource = function()
{
 return 'new HexGrid('+this.N+')'
}
/*
surface1 = {vertex: [0,0,0],
            normal:[0,0,1],
			u: [1,0,0], v: [0,1,0],
			reflectivity: .9,
            shape: new Conic({k:-1, R: 8, A:null}),
			boundary: {include: new Circle(1.5,[0,0]), exclude: new Circle(.5,[0,0.15])},
			grid: new Grid(25)
		   };

surface2 = {vertex: [0,0,4.1],
            normal:[0,0,-1],
			u: [1,0,0], v: [0,-1,0],
			reflectivity: 0,
            shape: new Plane(),
//			boundary:{type:'circle', center:[0,0], inner:.25, outer:.5},
		   };

//principal ray
ray1 = {origin: [0,0,5], direction:[.0001,0,-1], active: true};

// test conic against the OpTIIX asphere, which is defined in mm
//writeln(conic(1000,0,0,1/2200.00504,[0.117e-10,0.119e-17,0.196e-24]))
//ray1.direction = vnorm(ray1.direction);

// approximate surface intersection
//[p,n,d] = intersection(surface1,ray1)

//inc = ray1.direction;
//writeln(inc)
//writeln(n)
//writeln(reflect(inc,n));


bundle1 = [ray1];
for (var x=-1.5; x <=1.5; x+=0.15)
	for (var y=-1.5; y <=1.5; y+=0.15)
		bundle1.push({origin: [x,y,5], direction:[.0001,0,-1], active: true});

[bundle2, bounce1] = propagate(bundle1,surface1);
var boundary = boundaryCube(bundle1);

propagate(bundle2, surface2);
boundary = boundaryCube(bundle2,boundary);

raytrace = [{color:"red", vertex:vmean(bundle1.filter(function(x)x.active).map(function(x)x.origin)), rays:bundle1},
		{color:"blue", vertex:vmean(bundle2.filter(function(x)x.active).map(function(x)x.origin)), rays:bundle2},
		surface1,
		surface2]

for (var i=0;i<raytrace.length; i++) raytrace[i].i=i
*/

//scale(surface,0.001) to convert from mm to m
function scale(s,factor)
{
 for (var i=0;i<3; i++)
 {
  s.vertex[i] *= factor
 }
 if ('shape' in s && s.shape.constructor.name == 'Conic')
 {
	 s.shape.R *= factor
	 s.shape.C /= factor
	 var f2 = 1/(factor * factor);
	 var f = f2;
	 for (var i=0;i<s.shape.A.length; i++)
	 {
	 	s.shape.A[i] *= f;
	 	f = f*f2;
	 }
 }
}

surface1 = {name:"m1",
			vertex: [0, -2.8269317644784951e+002,3.0784779671588279e+002],
            normal:[0,  3.1603957901184462e-003,-9.9950047015745824e-001],
			u: [1,0,0], v: [0,1,0],
			reflectivity: .9,
            shape: new Conic({k:-9.2792338255509355e-001, R: -6.5005632632265281e+002, A:[-1.8314959986165069e-018, -6.3129257726002296e-024, 1.8217734536924851e-029]}),
			boundary: {include: new Circle(.250,[0,.282])},
			grid: new Grid(5)
		   };
surface2 = {name:"m2",
			vertex: [0, -2.6744129246637982e+002,3.4766669651084953e+001],
            normal:[0,  -8.1616654772661820e-002,-9.9666379570230201e-001],
			u: [1,0,0], v: [0,-1,0],
			reflectivity: .9,
            shape: new Conic({k:-2.5326524170220730e+000, R: -1.5082727176354931e+002, A:[-1.7412690459569431e-015,-1.0792331566259651e-018,1.8060548597373720e-022]}),
			//boundary: {include: new Circle(100,[0,0])},
			grid: new Grid(5)
		   };
surface3 = {name:"m3",
			vertex: [0, -2.1531264353162959e+002,4.2243032647784406e+002],
            normal:[0, -2.1364091182419237e-001,-9.7691225849352903e-001],
			u: [1,0,0], v: [0,1,0],
			reflectivity: .9,
            shape: new Conic({k:-3.2725867978542489e-001, R: -2.3826122427871169e+002, A:[7.5574500150340036e-015,1.5945357750582158e-020]}),
			//boundary: {include: new Circle(10,[0,0])},
			grid: new Grid(5)
		   };

surface4 = {name:"fp",vertex: [0,-2.7941998500345125e+002,2.8016803438220165e+002],
            normal:[0,3.4844127067301295e-001,9.3733061450684307e-001],
			u: [1,0,0], v: [0,-1,0],
			reflectivity: 0,
            shape: new Plane(),
			//boundary: {include: new Circle(150,[0,0])},
			grid: new Grid(5)
		   };

/*
surfaces = [surface1, surface2, surface3, surface4];
for each(var s in surfaces) scale(s,0.001)

//principal ray
ray1 = {origin: [0,0,0], direction:vnorm([0,0,1]), active: true, color:'blue'};

//ray bundle around that
bundle = [ray1];
function rectangleRays(xmin,xmax,ymin,ymax,spacing,direction)
{
 var bundle = []
 for (var x=xmin; x <=xmax; x+=spacing)
 	for (var y=ymin; y <=ymax; y+=spacing)
 		bundle.push({origin: [x,y,0], direction:ray1.direction, active: true});
 return bundle
}

bundle = bundle.concat(rectangleRays(-.25,.25,0,.5,.05,ray1.direction));

function trace(bundle, surfaces)
{
  var raytrace = []
  var boundary = boundaryCube(bundle)
  var bounce
  for each (var s in surfaces)
  {
   raytrace.push({color:"red", vertex:vmean(bundle.filter(function(x)x.active).map(function(x)x.origin)), rays:bundle})
   raytrace.push(s)

   [bundle, bounce] = propagate(bundle,s)

   boundary = boundaryCube(bundle,boundary);
  }
  return [raytrace, boundary]
}

//writeln(ray1.toSource())
var [raytrace, boundary]= trace(bundle,surfaces);
//writeln(ray1.toSource())

//writeln(boundary.toSource())
*/