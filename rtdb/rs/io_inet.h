#ifdef XP_UNIX
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#endif

class  InternetStream : public Stream   /* simple socket */
{public:
 unsigned int s; ///SOCKET s
 TStr hostinfo;
 int32 hostaddr;
 int port;
// TPointer<Stream> start;

 InternetStream();
 InternetStream(unsigned int socket, int host);
 InternetStream(const char* url,TNameValueList* headers = 0);
 InternetStream(const char host[],int port);
 ~InternetStream();

 void NoDelay();
 int GetLastError();
 int SkipHeaders(); ///returns the status
 int GetHeaders(TNameValueList &n); ///returns the status

 virtual bool eof();
 virtual bool canwrite();
 virtual bool canread();

 bool init(const char *host, int port,TStr* error=NULL);
 virtual int write(const char *b, int n);
 virtual int read(char *b, int n);
 virtual const char* filename() {return hostinfo;}
 bool sendln(const char s[]);
 bool recvln(char s[], int maxlen);
};

class InternetServer
{public:
 TPointer<xdb> error;
 unsigned int s;
 int port;
 sockaddr_in myaddr;
 TStr hostinfo;

 InternetServer(int port);
 ~InternetServer();
 InternetStream* Accept();

 bool AnyoneWaiting();

 protected:
 bool Startup();

};
