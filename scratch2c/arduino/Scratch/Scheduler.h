#ifndef SCRATCH_SCHEDULER_H
#define SCRATCH_SCHEDULER_H


#include <setjmp.h>

typedef struct _schedulable schedulable;
typedef void schedulableFunc(struct _schedulable *sched, void *data);

/**
 * returns -1 if function returned before calling yield()
 * returns 0 else, and schedulable structure may be scheduled later
 */
int newSchedulable(schedulable *s, schedulableFunc *f, void *data);

/**
 * continue schedulable execution
 * returns -1 if function ended instead of calling yield()
 * returns 0 else, and schedulable structure may be scheduled later
 */
int schedule(schedulable *s);

#define schedulerYield() \
	if (setjmp(sched->env) == 0) longjmp(mainScheduler, 1)

#define endSchedulable() \
	longjmp(mainScheduler, -1)

#endif
