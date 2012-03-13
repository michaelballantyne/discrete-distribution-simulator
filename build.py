import sys, mmap, re, shutil, os.path, os

if len(sys.argv) != 3 or not os.path.isfile(sys.argv[1]):
    print "usage: python build.py <html file> <version string>"
    exit()

fpath = sys.argv[1]
version = sys.argv[2]

fname = os.path.basename(fpath)
dirname = os.path.dirname(fpath)

distdir = os.path.join(dirname, 'dist')

if not os.path.exists(distdir):
    os.mkdir(distdir)

newfpath = os.path.join(distdir, version + '-' + fname)

if os.path.exists(newfpath):
    print "Error: version " + version + " output file already exists"
    exit()

infile = open(fpath, "rU");
ftext = infile.read()
infile.close()

print "Processing " + fname

def getFileContents(match):
    libfname = match.group(2).strip()
    print "found script " + libfname
    libf = open(libfname)
    libtext = libf.read()
    return "<script>\n" + libtext + "\n</script>"

pattern = re.compile(r'<script src=\"([^\"]+)\">.*?//= (.*?)</script>', re.DOTALL)
ftext = pattern.sub(getFileContents, ftext)

ftext = "<!-- version " + version + " -->\n" + ftext

outfile = open(newfpath, "w")
outfile.write(ftext)
outfile.close()

print "Finished building version " + version
