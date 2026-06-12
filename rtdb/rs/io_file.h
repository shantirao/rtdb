#ifndef _RS_FILESTREAM_H
#define _RS_FILESTREAM_H
#ifdef XP_UNIX
#include <unistd.h>
#include <sys/types.h>
#endif

class FileStream : public Stream
{
protected:
#ifdef XP_WIN
 HANDLE File; // let the OS do any buffering
 bool IsText;
 MemoryStream *Buffer;
 enum EBufMode {BufNone,BufRead,BufWrite} BufMode;
 void FlushCache(EBufMode mode);
 int32 ReadPosition;
#else
 FILE* File;  // system buffers
#endif
 bool canClose;
 int32 EndFileMarker;
 TStr FileName;
public: //open in read-write mode
 FileStream ();
 FileStream (const char * filename, TOpenMode OpenMode=OMDefault,TType Type=ReadOnly);
// TFileStream (const char * filename,TType Type, bool overwrite=true,
//              bool textmode=false, bool buffered = true);
 void Init(const char * filename,TType Type,bool textmode, bool buffer);
 // Init() can throw an exception
 // if Type == ReadOnly the file must already exist!

 ~FileStream();

 virtual int32 size();
 virtual int32 pos();
 virtual bool eof();
 virtual int32 goforward(int32 delta);//seeks forward
 virtual int32 putback(int32 delta);
 virtual int32 seek(int32 offset);
 virtual const char* filename() {return FileName;}

 virtual int read(char * dest,int maxcopy);
 virtual int write(const char * src,int maxcopy);

 bool IsValid() {return File != 0;}

 void SetEndMarker(int32 i) {EndFileMarker = i;}

#ifdef XP_WIN
 BOOL GetFileTime(FILETIME&f) {return ::GetFileTime(File,&f,0,0);}
 BOOL SetFileTime(FILETIME&f) {return ::SetFileTime(File,&f,&f,&f);}
 DWORD GetFileAttributes() {return ::GetFileAttributes(FileName);}
 BOOL SetEndOfFile(int32 position)
  {seek(position); return ::SetEndOfFile(File); }
#else
 bool SetEndOfFile(int32 position)
  {fflush(File); return (ftruncate(fileno(File),position)==0); }
#endif
};

#endif
