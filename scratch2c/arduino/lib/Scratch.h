//classe Scene, avec une instance _scene_
//classe Sprite
//main ?
// enum of messages

#define TURTLE

#ifdef WITH_SCHEDULER
	#include "Scheduler.h"
#else
	#define yield()
#endif

#include "List.h"
#include <math.h>

class Environment;

// a function pointer associated to a "hat" block
class ScratchObject;
typedef void(ScratchObject::*hatFunction)(Environment *);

// some enumerated types used as arguments in scratch blocks
typedef enum { sensorNone = -1 } sensorType;
typedef enum { RotateFull, RotateHoriz,  RotateNone } rotationStyle_t;
typedef enum {
	Effect_color, Effect_fisheye, Effect_whirl, Effect_pixelate,
	Effect_mosaic, Effect_brightness, Effect_ghost
} Effect_t;

class ScratchObject {
public:
	Environment *env;

	int volume = 100;
	// TODO : effects
	char instrument = 1;

	ScratchObject(Environment *env);

	// list of handlers affected to "whenGreenFlag", "whenClicked" ...
	virtual void whenGreenFlag();
	virtual void whenClicked();
	virtual void whenSceneStarts();
	virtual void whenIReceive(int message);
	virtual void whenKeyPressed(char key);
	virtual void whenSensorGreaterThan(sensorType sensor, int threshold);

	// execute every matching entry in whenSensorGreaterThan
	void dispatchSensorHats(char sensor, int threshold);

	void changeGraphicEffect_by_(Effect_t effect, float de);
	void setGraphicEffect_to_(Effect_t effect, float e);
	void filterReset();

	void playSound_(int sound);
	void doPlaySoundAndWait(int sound);

	void noteOn_duration_elapsed_from_();
	void instrument_(int instrument);
	void changeVolumeBy_(int dv);
	void setVolumeTo_(int v);

	void wait_elapsed_from_(float seconds);
	void rest_elapsed_from_(float beats);
	void pause(long milliseconds);

	virtual ~ScratchObject() {}
};

class Sprite:public ScratchObject {
public:
	bool firstClone = true;

	int xpos = 0, ypos = 0, heading = 0;
	float dx = 1.0, dy = 0;
	rotationStyle_t rotationStyle = RotateFull;

	char **costumes = {};
	int currentCostumeIndex = -1, nbCostumes = 0;
	char *costumeName = NULL;
	bool visible = true;
	int scale = 100, depth = 0;

	Sprite(Environment *env);
	Sprite(Sprite *from);
	virtual void whenCloned();

	virtual Sprite* clone();

#ifdef TURTLE
	void forward_(int amount);
	void turnRight_(int angle);
	void turnLeft_(int angle);
	void heading_(int angle);
	void pointTowards_(Sprite *other);
	void gotoX_y_(int nx, int ny);
	void gotoSpriteOrMouse_(Sprite *other);
	void glideSecs_toX_y_elapsed_from_(int nx, int ny, int duration);
	void changeXposBy_(int dx);
	void xpos_(int nx);
	void changeYposBy_(int dy);
	void ypos_(int ny);
	void bounceOffEdge();
	void setRotationStyle(rotationStyle_t e);
#endif

	void say_duration_elapsed_from_(const char *message);
	void say_(const char *message);
	void think_duration_elapsed_from_(const char *message);
	void think_(const char *message);
	void doAsk();

	void lookLike_(int c);
	void nextCostume();

#ifdef TURTLE
	void show();
	void hide();
	void changeSizeBy_(int ds);
	void setSizeTo_(int s);
	void comeToFront();
	void goBackByLayers_(int dz);
	void stampCostume();

	bool touching_(Sprite *s);
	int distanceTo_(Sprite *s);
	bool touchingColor_(Sprite *s, long color);
	bool color_sees_(long colorA, long colorB);
#endif

	void createCloneOf();
	bool deleteClone();

	virtual ~Sprite() {}
};

class Scene:public ScratchObject {
public:
	Scene(Environment *env);

	char **backgrounds = {};
	int currentBackgroundIndex = -1, nbBackgrounds = 0;
	char *backgroundName = NULL;

	void startScene(int bg);

	virtual ~Scene() {}
};

class ScratchRuntime;

class Environment {
public:
	// container class
	ScratchRuntime *runtime;

	// later this class will handle "pseudo thread" mechanism
//	List<schedulable> runnables = new List<schedulable *>();
//	void addRunnables(hatFunction *list, ScratchObject *object);
};

class ScratchRuntime {
public:
	Scene *scene = NULL;

	// list of every sprite created at startup or by clone method
	List<Sprite *> sprites;

	int tempo = 60;
	long beat = 60 * 1000 / tempo; // beat duration in ms

	// last input value
	const char* answer = NULL;

	unsigned long timerStart;

	ScratchRuntime(Environment *env);

	int run();

	void broadcast_(int message);
	void doBroadcastAndWait(int message);

	void stopAllSounds();
	void playDrum(int drum);
	void changeTempoBy_(int dt);
	void setTempoTo_(int t);

	void clearPenTrails();
	void putPenDown();
	void putPenUp();
	void penColor_(int color);
	void changePenHueBy_(int dh);
	void setPenHueTo_(int h);
	void changePenShadeBy_(int ds);
	void setPenShadeTo_(int s);
	void changePenSizeBy_(int ds);
	void penSize_(int s);

	void timerReset();
	unsigned long timer();

	int keyPressed_(char k);
	int mousePressed();
	int senseVideoMotion();
	char *timeAndDate();
	long timestamp();

};

namespace Scratch {
	typedef enum {
		f_sqrt, f_abs,
		f_sin, f_cos, f_tan,
		f_asin, f_acos, f_atan,
		f_e_, f_10_, f_ln, f_log,
		f_floor, f_ceiling
	} MathFunc;

	int randomFrom_to_(int from, int to) {
		// TODO
		return from;
	}
	char * concatenate_with_(char *a, char *b) {
		// TODO
		return a;
	}
	char letter_of_(char *s, int pos) {
		return s[pos - 1];
	}
	int stringLength_(char *s) {
		return strlen(s);
	}
	int rounded(float f) {
		return (int)f;
	}
	float computeFunction_of_(MathFunc f, float v) {
		switch(f) {
		case f_sqrt:
			return sqrt(v);
		case f_abs:
			return v >= 0 ? v : -v;
		case f_sin:
			return sin(v * M_PI / 180.0);
		case f_cos:
			return cos(v * M_PI / 180.0);
		case f_tan:
			return tan(v * M_PI / 180.0);
		case f_asin:
			return asin(v) * 180.0 / M_PI;
		case f_acos:
			return acos(v) * 180.0 / M_PI;
		case f_atan:
			return atan(v) * 180.0 / M_PI;
		case f_e_:
			return exp(v);
		case f_10_:
			return pow(v, 10);
		case f_ln:
			return log(v);
		case f_log:
			return log10(v);
		case f_floor:
			return floor(v);
		case f_ceiling:
			return ceil(v);
		}
	}
}
