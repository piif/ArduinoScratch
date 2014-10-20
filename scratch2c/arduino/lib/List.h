// Basic templated list, with indexes beginning at 1, like in Scratch lists
// Limitation: a Scratch list may contain numbers and strings.
// This one can only handle one type per list.

#include <string.h>
#include <stdlib.h>
#include <stdexcept>

using namespace std;

#define StepSize 5

template<typename T> class List {
public:
	int length;

	List() {
		length = 0;
		size = 0;
		data = NULL;
	}

	T operator[](int i) {
		if (i < 1 || i > length) {
			throw out_of_range("List index out of range");
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
			throw out_of_range("List index out of range");
		}
		T old = data[i - 1];
		memmove(&(data[i - 1]), &(data[i]), sizeof(T) * (length - i));
		length--;
		resize(length);
		return old;
	}

	void insertAt(int i, T value) {
		if (i == length + 1) {
			append(value);
			return;
		}
		if (i < 1 || i > length) {
			throw out_of_range("List index out of range");
		}
		length++;
		resize(length);
		memmove(&(data[i]), &(data[i - 1]), sizeof(T) * (length - i));
		data[i - 1] = value;
	}

	void setAt(int i, T value) {
		if (i < 1 || i > length) {
			throw out_of_range("List index out of range");
		}
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
