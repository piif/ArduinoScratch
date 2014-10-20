//classe Scene, avec une instance _scene_
//classe Sprite
//main ?
// scheduler : List<Schedulable>
// enum of messages

#include "Scratch.h"

ScratchRuntime::ScratchRuntime() {

}

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

int ScratchRuntime::run() {
	// TODO loop on runnable
	// schedule it
	// if ended, remove else ++ in list
	// return remaining runnables

	// => main loop while != 0
	// then wait for sensors and loop
}

Sprite::Sprite() {
	uidGenerator++;
	uid = uidGenerator;
	if (uid == 1) {
		Scratch.addRunnables(whenGreenFlag, this);
	} else {
		Scratch.addRunnables(whenCloned, this);
	}
}


Scene::Scene() {
	Scratch.addRunnables(whenGreenFlag, this);
}

