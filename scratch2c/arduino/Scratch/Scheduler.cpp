#include <setjmp.h>
#include "Scheduler.h"

jmp_buf mainScheduler;

typedef struct _schedulable {
	jmp_buf env;
	schedulableFunc *func;
} schedulable;

int newSchedulable(schedulable *s, schedulableFunc *f, void *data) {
	s->func = f;
	if (setjmp(mainScheduler) == 0) {
		f(s, data);
		return -1;
	} else {
		return 0;
	}
}

int schedule(schedulable *s) {
	int res = setjmp(mainScheduler);
	if (res == 0) {
		longjmp(s->env, 1);
	}
	return (res == 1) ? 0 : -1;
}
