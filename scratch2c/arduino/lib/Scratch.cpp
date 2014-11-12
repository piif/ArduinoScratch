//classe Scene, avec une instance _scene_
//classe Sprite
//main ?
// scheduler : List<Schedulable>
// enum of messages

#include "Scratch.h"

#ifdef ARDUINO
	#define time() (millis()/1000)
	typedef long time_t;
	#define pause(ms) delay(ms)
	#define readInput() "TODO"
	#define LOG(m) Serial.println(m)
#else
//	#include <stddef>
	#include <time.h>
	void pause(long ms) {
		struct timespec t = {ms / 1000, 1000 * (ms % 1000)};
		nanosleep(&t, NULL);
	}
	#define readInput() "TODO"
	#define LOG(m) puts(m)
#endif


ScratchObject::ScratchObject(Environment *env): env(env) {
}
void ScratchObject::changeGraphicEffect_by_(Effect_t effect, float de) {
	// TODO
}
void ScratchObject::setGraphicEffect_to_(Effect_t effect, float e) {
	// TODO
}
void ScratchObject::filterReset() {
	// TODO
}

Sprite::Sprite(Environment *env) : ScratchObject(env) {
}
Sprite::Sprite(Sprite *from) : Sprite(from->env) {
	volume = from->volume;
	instrument = from->instrument;

	xpos = from->xpos;
	ypos = from->ypos;
	heading = from->heading;
	dx = from->dx;
	dy = from->dy;
	rotationStyle = from->rotationStyle;
	costumes = from->costumes;
	currentCostumeIndex = from->currentCostumeIndex;
	nbCostumes = from->nbCostumes;
	costumeName = from->costumeName;
	visible = from->visible;
	scale = from->scale;
	depth = from->depth;
}

//Sprite* Sprite::clone() {
//	return new Sprite(this);
//}

#ifdef TURTLE
void Sprite::forward_(int amount){
	xpos += amount * dx;
	ypos += amount * dy;
}
void Sprite::turnRight_(int angle){
	heading -= angle;
	dx = cos(heading);
	dy = sin(heading);
}
void Sprite::turnLeft_(int angle){
	heading += angle;
	dx = cos(heading);
	dy = sin(heading);
}
void Sprite::heading_(int angle){
	heading = angle;
	dx = cos(heading);
	dy = sin(heading);
}
void Sprite::pointTowards_(Sprite *other){
	dx = other->xpos - xpos;
	dy = other->ypos - ypos;
	// TODO : normalze
	// TODO : deduce new angle
}
void Sprite::gotoX_y_(int nx, int ny){
	xpos = nx; ypos = ny;
}
void Sprite::gotoSpriteOrMouse_(Sprite *other){
	xpos = other->xpos;
	ypos = other->ypos;
}
void Sprite::glideSecs_toX_y_elapsed_from_(int nx, int ny, int duration){
	// TODO
}
void Sprite::changeXposBy_(int dw){
	xpos += dx;
}
void Sprite::xpos_(int nx){
	xpos = nx;
}
void Sprite::changeYposBy_(int dy){
	ypos += dy;
}
void Sprite::ypos_(int ny){
	ypos = ny;
}
void Sprite::bounceOffEdge(){
	// TODO
}
void Sprite::setRotationStyle(RotationStyle_t r){
	rotationStyle = r;
}
#endif

void Sprite::say_duration_elapsed_from_(const char *message){
	LOG(message);
}
void Sprite::say_(const char *message){
	LOG(message);
}
void Sprite::think_duration_elapsed_from_(const char *message){
	LOG(message);
}
void Sprite::think_(const char *message){
	LOG(message);
}
void Sprite::doAsk(){
	env->runtime->answer = readInput();
}

void Sprite::lookLike_(int c){
	currentCostumeIndex = c - 1;
	costumeName = costumes[c - 1];
}
void Sprite::nextCostume() {
	lookLike_((currentCostumeIndex + 1) % nbCostumes);
}

#ifdef TURTLE
void Sprite::show() {
	// TODO
}
void Sprite::hide() {
	// TODO
}
void Sprite::changeSizeBy_(int ds) {
	// TODO
}
void Sprite::setSizeTo_(int s) {
	// TODO
}
void Sprite::comeToFront() {
	// TODO
}
void Sprite::goBackByLayers_(int dz){
	// TODO
}
void Sprite::stampCostume() {
	// TODO
}

bool Sprite::touching_(Sprite *s) {
	// TODO
	return false;
}
int Sprite::distanceTo_(Sprite *s) {
	// TODO
	return false;
}
bool Sprite::touchingColor_(Sprite *s, long color) {
	// TODO
	return false;
}
bool Sprite::color_sees_(long colorA, long colorB) {
	// TODO
	return false;
}
#endif

void Sprite::createCloneOf() {
	Sprite *cloned = this->clone();
	env->runtime->sprites.append(cloned);
	cloned->whenCloned();
}

bool Sprite::deleteClone() {
	if (firstClone) {
		// can't delete first instance
		return false;
	}
	List<Sprite *> all = env->runtime->sprites;
	for (int i = 0; i < all.length; i++) {
		if (all[i] == this) {
			all.remove(i);
			break;
		}
	}
	delete(this);
	return true;
}

void ScratchObject::playSound_(int sound) {
}
void ScratchObject::doPlaySoundAndWait(int sound) {
}


void ScratchObject::noteOn_duration_elapsed_from_() {
}
void ScratchObject::instrument_(int instrument) {
}
void ScratchObject::changeVolumeBy_(int dv) {
	volume += dv;
}
void ScratchObject::setVolumeTo_(int v) {
	volume = v;
}

void ScratchObject::wait_elapsed_from_(float seconds) {
	pause(seconds * 1000);
}
void ScratchObject::rest_elapsed_from_(float beats) {
	pause(beats * beats);
}

Scene::Scene(Environment *env) : ScratchObject(env) {
}

void Scene::startScene(int bg) {
	currentBackgroundIndex = bg - 1;
	backgroundName = backgrounds[bg - 1];
	// TODO : what should we do with destroyed hats during loop ?
	// => delay destroy call but mark as deleted ?
	int nbSprites = env->runtime->sprites.length; // avoid to loop over clones created during hats
	whenSceneStarts(bg);
	for (int i = 1; i <= nbSprites; i++) {
		env->runtime->sprites[i]->whenSceneStarts(bg);
	}
}

ScratchRuntime::ScratchRuntime(Environment *env) {
	timerStart = time(NULL);
	env->runtime = this;
}

#ifdef WITH_SCHEDULER
void ScratchRuntime::addRunnables(hatFunction *list, ScratchObject *object) {
	schedulable item;
	while(*list) {
		int res = newSchedulable(&item, object->*list[0], 0);
		if (res != -1) {
			runnables.append(item);
		}
		list++;
	}
}
#endif

int ScratchRuntime::run() {
#ifdef WITH_SCHEDULER
	// TODO for SCHEDULER version :
	// loop on runnable
	// schedule it
	// if ended, remove else ++ in list
	// return remaining runnables

	// => main loop while != 0
	// then wait for sensors and loop
#endif

	int nbFirst = sprites.length; // avoid to loop over clones created during green hats
	scene->whenGreenFlag();
	for (int i = 1; i <= nbFirst; i++) {
		sprites[i]->whenGreenFlag();
	}
	return 0;
}

void ScratchRuntime::broadcast_(int message) {
	doBroadcastAndWait(message);
}
void ScratchRuntime::doBroadcastAndWait(int message) {
	int nbSprites = sprites.length; // avoid to loop over clones created during hats
	scene->whenIReceive(message);
	for (int i = 1; i <= nbSprites; i++) {
		sprites[i]->whenIReceive(message);
	}
}

void ScratchRuntime::stopAllSounds() {
	// TODO
}
void ScratchRuntime::playDrum(int drum) {
	// TODO
}
void ScratchRuntime::changeTempoBy_(int dt) {
	setTempoTo_(tempo + dt);
	beat = 60 * 1000 / tempo;

}
void ScratchRuntime::setTempoTo_(int t) {
	tempo = (t > 0) ? t : 1;
	beat = 60 * 1000 / tempo;
}

void ScratchRuntime::clearPenTrails() {
	// TODO
}
void ScratchRuntime::putPenDown() {
	// TODO
}
void ScratchRuntime::putPenUp() {
	// TODO
}
void ScratchRuntime::penColor_(int color) {
	// TODO
}
void ScratchRuntime::changePenHueBy_(int dh) {
	// TODO
}
void ScratchRuntime::setPenHueTo_(int h) {
	// TODO
}
void ScratchRuntime::changePenShadeBy_(int ds) {
	// TODO
}
void ScratchRuntime::setPenShadeTo_(int s) {
	// TODO
}
void ScratchRuntime::changePenSizeBy_(int ds) {
	// TODO
}
void ScratchRuntime::penSize_(int s) {
	// TODO
}

void ScratchRuntime::timerReset() {
	timerStart = time(NULL);
}
unsigned long ScratchRuntime::timer() {
	return time(NULL) - timerStart;
}

bool ScratchRuntime::keyPressed_(char k) {
	// TODO
	return false;
}
bool ScratchRuntime::mousePressed() {
	// TODO
	return false;
}
int ScratchRuntime::senseVideoMotion() {
	// TODO
	return -1;
}
const char *ScratchRuntime::timeAndDate(DateKind_t k) {
	// TODO
	return "";
}
long ScratchRuntime::timestamp() {
	// TODO
	return 0;
}

int Scratch::randomFrom_to_(int from, int to) {
	// TODO
	return from;
}
char * Scratch::concatenate_with_(char *a, char *b) {
	// TODO
	return a;
}
char Scratch::letter_of_(char *s, int pos) {
	return s[pos - 1];
}
int Scratch::stringLength_(char *s) {
	return strlen(s);
}
int Scratch::rounded(float f) {
	return (int)f;
}
float Scratch::computeFunction_of_(MathFunc f, float v) {
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
