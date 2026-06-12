Hexapod V3
changes from V2
Introduces Mirror Coordinate Frame, in which Hexapod Z = - MCF Z
In the hexapod coordinate frame, MCF Y is -30º from Hexapod Y
To convert from MCF to Hexapod
 rotate -30º about Z   sin(30) = 0.5, cos(30)=sqrt(3)/2
 then swap signs of X and Z

Rotation
X = [ c -s ] X'
Y   [ s c  ] Y'


X = [ -1 0  0 ][ c -s 0 ] X' =
Y   [ 0  1  0 ][ s  c 0 ] Y'
Z   [ 0  0 -1 ][ 0  0 1 ] Z'

To convert from Hexapod to MDF
 rotate -30º about Hexapod Z
 then swap signs of X and Z


Hex	=		T		*	MCF
X		-c	s	0		X'
Y		s	c	0		Y'
Z		0	0	-1		Z'

