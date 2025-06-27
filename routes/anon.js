import { Router } from 'express';

const router = Router();

const adjectives = [
  'Mysterious', 'Cosmic', 'Shy', 'Brave', 'Funky', 'Sneaky', 'Zesty', 'Nimble',
  'Cranky', 'Witty', 'Grumpy', 'Jolly', 'Gentle', 'Spicy', 'Swift', 'Clever',
  'Feisty', 'Silent', 'Dizzy', 'Quirky', 'Happy', 'Loyal', 'Bold', 'Cool'
];

const animals = [
  'Penguin', 'Otter', 'Llama', 'Fox', 'Panther', 'Frog', 'Tiger', 'Koala',
  'Moose', 'Eagle', 'Rabbit', 'Cheetah', 'Dolphin', 'Giraffe', 'Panda',
  'Hedgehog', 'Sloth', 'Turtle', 'Raven', 'Wolf', 'Octopus', 'Narwhal', 'Hyena'
];

function generateName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(100 + Math.random() * 900); 
  return `${adj}${animal}${number}`;
}

router.get('/generate-name', (req, res) => {
  const name = generateName();
  res.json({ anonymousName: name });
});

export default router;
export { generateName };
