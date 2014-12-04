# THIS RULE GEENRATE CPP CODE FROM SCRATCH PROJECT
%.cpp: %.json %.config
	node ../scratch2c/s2c.js $*.config $*.json > $@ || rm $@

# ARDUINO TOOLCHAIN PART

# the directory this project is in
# must be defined for generic makefile to work
export PROJECT_DIR := $(dir $(realpath ${MAKEFILE_LIST}))

# to define to ArduinoCore root directory 
CORE_DIR := ${PROJECT_DIR}../../ArduinoCore/

# other arduino librairies project pathes this project depends on
export DEPENDENCIES := ${CORE_DIR} arduino/Scratch ${CORE_DIR}../ArduinoTools/

# generate assembler source code also
export WITH_ASSEMBLY := yes

# generate eeprom image
export WITH_EEPROM := no

# print size of geretated segments 
export WITH_PRINT_SIZE := yes

# only for programs : launch upload
export WITH_UPLOAD := no
# where to upload
# TODO : try to auto detect with lsusb + /proc exploration
export UPLOAD_DEVICE := /dev/ttyACM0

export STANDARD := -std=gnu++11

# THIS RULE WILL COMPILE ARDUINO SCRATCH LIB
lib:
	${MAKE} -f ${CORE_DIR}etc/lib.makefile DEPENDENCIES= \
		LIB_NAME=Scratch PROJECT_DIR=${PROJECT_DIR}arduino/Scratch/

# THIS RULE WILL COMPILE A GENERATED CPP FILE
all upload console: lib
	${MAKE} -f ${CORE_DIR}etc/bin.makefile USER_CFLAGS=-Iarduino $@

clean:
ifeq (${TARGET},)
	rm -rf ${PROJECT_DIR}target/*
endif
ifneq (${TARGET},)
	rm -rf ${PROJECT_DIR}target/${TARGET}
endif

.PHONY: bin lib upload

## THIS PART WILL COMPILE Scratch LIB FOR COMPUTER TARGET
libScratch: target/libScratch.a

target/libScratch.a: target/Scratch.o
	${AR} -r $@ $<

CFLAGS=-g -IScratch ${STANDARD}
target/Scratch.o: arduino/Scratch/Scratch.cpp arduino/Scratch/Scratch.h arduino/Scratch/List.h
	${CXX} -c ${CFLAGS} $< -o $@

## THIS PART WILL COMPILE GENERATED CODE FOR COMPUTER TARGET

CFLAGS=-g -Iarduino -Iarduino/Scratch -std=c++11
%.o: %.cpp
	@echo "cpp->o"
	${CXX} -c ${CFLAGS} $< -o $@

##$(info ${NATIVES:%.cpp=%.o})
NATIVE_OBJS := ${NATIVES:%.cpp=%.o}

LDFLAGS=-Ltarget
%: %.o ${NATIVE_OBJS} target/libScratch.a
	@echo "bin"
	${CXX} ${LDFLAGS} $< ${NATIVE_OBJS} -o $@ -lScratch
