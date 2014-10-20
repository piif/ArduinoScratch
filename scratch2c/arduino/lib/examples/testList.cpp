#include <stdio.h>
#include "List.h"
#include <iostream>
#include <string>

using namespace std;

int main() {
	List<int> li;
	li.append(42);
	li.insertAt(1, 12);
	li.setAt(2, 43);
	printf("li len = %d (2)\n", li.length);
	printf("li[1] = %d (12)\n", li[1]);

	li.empty();
	for(int i = 0; i < 30; i++) {
		li.insertAt(1, i);
	}
	li.remove(5);
	printf("li len = %d (29)\n", li.length);
	printf("li[15] = %d (14)\n", li[15]);

	List<const char *> ls;
	ls.append("forty two");
	ls.insertAt(1, "twelve");
	ls.setAt(2, "forty three");
	printf("ls len = %d (2)\n", ls.length);
	printf("li[1] = %s (12)\n", ls[1]);
//	cout << "ls[1] = " << ls[1] << " (twelve)\n";

	return 0;
}
