//classe Scene, avec une instance _scene_
//classe Sprite
//main ?
// scheduler : List<Schedulable>
// enum of messages

#include "Scheduler.h"
#include "List.h"

class ScratchObject;
typedef void(ScratchObject::*hatFunction)(schedulable *, void *);

class ScratchRuntime {
	List<schedulable> runnables = new List<schedulable *>();
	Scene scene; // TODO : or global _scene_ ?
	List<Sprite> sprites = new List<Sprite>();
	ScratchRuntime();

	void addRunnables(hatFunction *list, ScratchObject *object);
	void run();
};
ScratchRuntime Scratch;

typedef enum { sensorNone } sensorType;

class ScratchObject {
	// list of schedulable affected to "whenGreenFlag", "whenClicked" ...
	hatFunction *whenGreenFlag = { NULL };
	hatFunction *whenClicked = { NULL };
	hatFunction *whenSceneStarts = { NULL };
	// list of message numbers for which there are "whenIReceive" hats
	int *messages = { -1 };
	// associated list of list of schedulable : one list per entry in messages
	hatFunction **whenIReceive = { NULL };
	// associated list of keys for which there are "whenKeyPressed" hats
	char *keys = { '\0' };
	// list of list of schedulable : one list per entry in keys
	hatFunction **whenKeyPressed = { NULL };
	// list of sensors and thresholds for which there are "whenSensorGreaterThan" hats
	char *sensors = { sensorNone };
	int *thresholds = { -1 };
	// associated list of list of schedulable : one list per entry in sensors/thresholds
	hatFunction **whenSensorGreaterThan = { NULL };
};


class Sprite:ScratchObject {
	static int uidGenerator = 0;
	int uid;
	// list of schedulable affected to "whenCloned"
	hatFunction *whenCloned = { NULL };

	Sprite();
};

class Scene:ScratchObject {
	Scene();
};
