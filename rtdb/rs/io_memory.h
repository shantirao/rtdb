#ifndef _RS_STREAM_H
#pragma warn "include rs/stream.h instead"
#endif



class MemoryStream: public Stream
{//a glorified TStr, only optimized for appending and binary data.
public:
TChars Mem;
int32 Position,Maxsize;

MemoryStream() ;
MemoryStream(int32 size);
~MemoryStream() ;
int32 seek(int32 offset);
virtual int32 size();
virtual int32 pos();
virtual bool eof();
int32 goforward(int32 delta);//seeks forward
int32 putback(int32 delta);
virtual int read(char * dest,int maxcopy);
virtual int write(const char * src,int maxcopy);
void Clear(int32 size=0);
void Resize(int32 size);
operator char * () {((char *)Mem)[Maxsize] = 0; return (char*)Mem;}
void operator = (const char * c) {Clear(); writestr(c);}
bool operator == (const char * c) {return !strcasecmp((char*)*this,c?c:"");}
bool operator != (const char * c) {return strcasecmp((char*)*this,c?c:"");}
bool canwrite() {return true;}

};

//ByteStream doesn't own its data. It's for turning a string that
//you own into a stream temporarily.
class ByteStream: public Stream
{
public:
char * Buf;
int32 Position,Maxsize;

ByteStream(char * Buf,int32 Size=0);
ByteStream(const char * Buf,int32 Size=0);
ByteStream(uint16 * Buf,int32 Size=0);
ByteStream(const uint16 * Buf,int32 Size=0);  //number of bytes, not characters
~ByteStream();
int32 seek(int32 offset);
int32 size();
int32 pos();
bool eof();
int32 goforward(int32 delta);//seeks forward
int32 putback(int32 delta);
int read(char * dest,int maxcopy);
int write(const char * src,int maxcopy);
bool canwrite() {return Position < Maxsize;}
};
