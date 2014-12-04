// Basic templated list, with indexes beginning at 1, like in Scratch lists
// Limitation: a Scratch list may contain numbers and strings.
// This one can only handle one type per list.

#ifndef SCRATCH_LIST_H
#define SCRATCH_LIST_H

#include <string.h>
#include <stdlib.h>
#ifdef ARDUINO
#include <Arduino.h>
#define throw
#define out_of_range(m) {Serial.println(m); for(;;);}
#define logic_error(m) {Serial.println(m); for(;;);}
#else
#include <stdexcept>
#endif

using namespace std;

// 7 to avoid repeated realloc when append/remove/insert on
// list with a round item number
#define StepSize 7

template<typename T> class List {
public:
	int length;

	List() {
		length = 0;
		size = 0;
		data = NULL;
	}

	List<T> clone() {
		List<T> *cloned = new List<T>();
		cloned->length = length;
		cloned->resize(length);
		memmove(cloned->data, data, sizeof(T) * length);
	}

	T &operator[](int i) {
		if (i < 1 || i > length) {
			throw out_of_range("List[] index out of range");
		}
		return data[i - 1];
	}

	void append(T value) {
		length++;
		resize(length);
		data[length - 1] = value;
	}

	void empty() {
		length = 0;
		resize(length);
	}

	T remove(int i) {
		if (i < 1 || i > length) {
			throw out_of_range("List.remove index out of range");
		}
		T old = data[i - 1];
		memmove(&(data[i - 1]), &(data[i]), sizeof(T) * (length - i));
		length--;
		resize(length);
		return old;
	}

	void insertAt(T value, int i) {
		if (i == length + 1) {
			append(value);
			return;
		}
		if (i < 1 || i > length) {
			throw out_of_range("List.insertAt index out of range");
		}
		length++;
		resize(length);
		memmove(&(data[i]), &(data[i - 1]), sizeof(T) * (length - i));
		data[i - 1] = value;
	}

	~List() {
		free(data);
		length = size = 0;
	}

private:

	void resize(int l) {
		int newSize;
		if (l % StepSize == 0) {
			newSize = l;
		} else {
			newSize = l + StepSize - (l % StepSize);
		}
		if (newSize == size) {
			return;
		}
		size = newSize;
		data = (T *)realloc(data, sizeof(T) * size);
		if (data == NULL && l != 0) {
			throw logic_error("Out of memory");
		}
	}
	T *data;
	int size;
};

#endif

