$(info ${NATIVES:%.cpp=%.o})
 
%.cpp: %.json %.config
	node ../scratch2c/s2c.js $*.config $*.json > $@ || rm $@

CFLAGS=-g -I../scratch2c/arduino -I../scratch2c/arduino/lib -std=c++11
%.o: %.cpp
	@echo "cpp->o"
	${CXX} -c ${CFLAGS} $< -o $@

NATIVE_OBJS := ${NATIVES:%.cpp=%.o}

LDFLAGS=-L../scratch2c/arduino/target
%: %.o ${NATIVE_OBJS} ../scratch2c/arduino/target/libscratch.a
	@echo "bin"
	${CXX} ${LDFLAGS} $< ${NATIVE_OBJS} -o $@ -lscratch
