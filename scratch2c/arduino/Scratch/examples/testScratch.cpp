class SpriteA:Sprite {
	hat 1
	hat 2
	when... = { &SpriteA::hat 1, NULL }
};

class SpriteB:Sprite {
	hat 1
	hat 2
	when... = { &SpriteB::hat 1, NULL }
};

main {
	SpriteA firstA;
	SpriteA cloneA;
	SpriteB firstB;
	while(Scratch.run());
}
