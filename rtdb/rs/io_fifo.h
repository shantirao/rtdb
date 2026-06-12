#ifndef __IO_FIFO_H
#define __IO_FIFO_H

/*
   by Jason M Sachs  7/11/2008
 */

#ifndef _RS_STREAM_H
#pragma warn "include rs/stream.h instead"
#endif

#include <deque>

class FIFOStream: public Stream
{
protected:
    int32 _inpos, _outpos;
    int32 maxsize;
    typedef char char_type; // in case this converts to wchar_t later?
    std::deque<char_type> fifo;

    inline int pull(char_type *dest, int n)
    {
        int i = 0;
        for (i = 0; i < n && fifo.size() > 0; ++i)
        {
            if (dest)
            {
                *dest++ = fifo.back();
            }
            fifo.pop_back();
        }
        _outpos += i;
        return i;
    }
    inline int push(const char_type *src, int n)
    {
        int i;
        for (i = 0; i < n && fifo.size() < maxsize; ++i)
        {
            fifo.push_front(*src++);
        }
        _inpos += i;
        return i;
    }
public:


FIFOStream() ;
FIFOStream(int32 size);
~FIFOStream() ;
int32 seek(int32 offset);
int32 size();
int32 pos();
bool eof();
int32 goforward(int32 delta);//seeks forward
int32 putback(int32 delta);
int read(char_type * dest,int maxcopy) { return pull(dest,maxcopy); }
int write(const char_type * src,int maxcopy) { return push(src,maxcopy); }
void Clear(int32 size=0) { fifo.clear(); _inpos = _outpos = 0; }
void Resize(int32 size);
//operator char * () {((char *)Mem)[Maxsize] = 0; return (char*)Mem;}
//void operator = (const char * c) {Clear(); writestr(c);}
//bool operator == (const char * c) {return !strcasecmp((char*)*this,c?c:"");}
//bool operator != (const char * c) {return strcasecmp((char*)*this,c?c:"");}
bool canwrite() {return fifo.size() < maxsize;}

};

#endif
