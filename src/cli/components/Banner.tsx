import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { VERSION } from '../../core/version';

const FRAMES = [
  // Frame 1: eyes open, tail right
  [
    '   /\\_____/\\   ',
    '  /  o   o  \\  ',
    ' ( ==  ^  == ) ',
    '  )         (  ',
    ' (   ) . (   ) ',
    '(__(__)_(__) _)',
    '            ~/ ',
  ],
  // Frame 2: slow blink, tail up
  [
    '   /\\_____/\\   ',
    '  /  -   -  \\  ',
    ' ( ==  ^  == ) ',
    '  )         (  ',
    ' (   ) . (   ) ',
    '(__(__)_(__)  )',
    '           |/  ',
  ],
  // Frame 3: eyes open, tail left
  [
    '   /\\_____/\\   ',
    '  /  o   o  \\  ',
    ' ( ==  ^  == ) ',
    '  )         (  ',
    ' (   ) . (   ) ',
    '(__(__)_(__) _)',
    '          \\~   ',
  ],
  // Frame 4: looking right, tail right
  [
    '   /\\_____/\\   ',
    '  /  o   o  \\  ',
    ' ( ==  ^  == ) ',
    '  )  meow!  (  ',
    ' (   ) . (   ) ',
    '(__(__)_(__) _)',
    '            ~/ ',
  ],
];

export function Banner() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const catLines = FRAMES[frame]!;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {catLines.map((line, i) => (
        <Box key={i} flexDirection="row">
          <Text color="yellow">{line}</Text>
          {i === 2 && <Text bold color="magenta">  catmit</Text>}
          {i === 3 && <Text dimColor>  AI-powered commit messages</Text>}
          {i === 4 && <Text dimColor>  v{VERSION}</Text>}
        </Box>
      ))}
    </Box>
  );
}
