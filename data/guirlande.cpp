// project guirlande.json
#include "Scratch.h"
#include "extensions/ledStrip.h"
// uses extensions :
//   led strip extension
Environment *env = new Environment();
// prototypes
class Scratch_guirlande;
class Sprite_animation;
class Scene_guirlande;
// variables
int nombre_lampes = 60;
int pause = 1;
int lumi_re = 100;
List<float> couleur;
// sprites
class Sprite_animation:public Sprite {
public:
	// variables
	int lampe = 61;
	int _tape = 1;
	float c1 = 126.66666666666667;
	const char * l1 = "";
	virtual Sprite_animation* clone() {
		return new Sprite_animation(this);
	}
	Sprite_animation(Sprite_animation*from): Sprite(from) {
		lampe = from->lampe;
		_tape = from->_tape;
		c1 = from->c1;
		l1 = from->l1;
	}
	Sprite_animation(Environment *env): Sprite(env) {
	}
	virtual void whenGreenFlag() {

	}
	virtual void whenClicked() {

	}
	virtual void whenSceneStarts(int background) {
		switch(background) {
		}
	}
	virtual void whenIReceive(int message) {
		switch(message) {
		case 0: // "préparer premier"
			whenIReceive_1(env);
			break;
		case 1: // "préparer"
			whenIReceive_2(env);
			break;
		}
	}
	virtual void whenKeyPressed(char key) {
		switch(key) {
		}
	}
	virtual void whenSensorGreaterThan(Sensor_t sensor, int threshold) {
		switch(sensor) {
		}
	}
	virtual void whenCloned() {

	}
	// scripts
	void whenIReceive_1 (Environment *env) {
		_tape = 0;
		lampe = 1;
		for(int __l1 = 0; __l1 < (couleur.length); __l1++) {
			couleur[lampe] = (lampe)*((255)/(60));
			lampe += 1;
			schedulerYield();
		}
		_tape += 1;
	}
	void whenIReceive_2 (Environment *env) {
		couleur.insertAt(1, couleur[couleur.length]);
		couleur.remove(couleur.length);
	}
	virtual ~Sprite_animation() {}
};
// scene
class Scene_guirlande:public Scene {
public:
	Scene_guirlande(Environment *env): Scene(env) {
	}
	virtual void whenGreenFlag() {
		whenGreenFlag_3(env);
	}
	virtual void whenClicked() {

	}
	virtual void whenSceneStarts(int background) {
		switch(background) {
		}
	}
	virtual void whenIReceive(int message) {
		switch(message) {
		case 2: // "initialiser"
			whenIReceive_2(env);
			break;
		case 3: // "dessiner"
			whenIReceive_4(env);
			break;
		}
	}
	virtual void whenKeyPressed(char key) {
		switch(key) {
		case ' ':
			whenKeyPressed_1(env);
			break;
		}
	}
	virtual void whenSensorGreaterThan(Sensor_t sensor, int threshold) {
		switch(sensor) {
		}
	}
	// scripts
	void whenKeyPressed_1 (Environment *env) {
		pause = (1)-(pause);
	}
	void whenIReceive_2 (Environment *env) {
		led_strip_extension::initStrip(env,nombre_lampes);
		wait_elapsed_from_(0.2);
		led_strip_extension::setStripLight(env,lumi_re);
	}
	void whenGreenFlag_3 (Environment *env) {
		pause = 0;
		nombre_lampes = 60;
		lumi_re = 100;
		couleur.empty();
		for(int __l1 = 0; __l1 < (nombre_lampes); __l1++) {
			couleur.append(0);
			schedulerYield();
		}
		env->runtime->setTempoTo_(400);
		env->runtime->doBroadcastAndWait(2);
		env->runtime->doBroadcastAndWait(0);
		for(;;) {
			env->runtime->broadcast_(3);
			if((pause) == (1)) {
				// doWaitUntil
			}
			rest_elapsed_from_(0.05);
			env->runtime->broadcast_(1);
			schedulerYield();
		}
	}
	void whenIReceive_4 (Environment *env) {
		led_strip_extension::setStripColors(env,couleur);
	}
	virtual ~Scene_guirlande() {}
};
class Scratch_guirlande:public ScratchRuntime {
public:
	Sprite_animation *firstSprite_animation;
	const char *messages[4] = { "préparer premier", "préparer", "initialiser", "dessiner" };
	int nbMessages = 4;
	Scratch_guirlande(Environment *env): ScratchRuntime(env) {
		scene = new Scene_guirlande(env);
		firstSprite_animation = new Sprite_animation(env);
		sprites.append(firstSprite_animation);
	};
};
Scratch_guirlande runtime(env);
int scratchMain() {
	led_strip_extension::init(env);
	runtime.run();
}
