import { Box, Text } from 'ink';

const CAT_ART = `       /\\___/\\
      (  o o  )
      (  =^=  )
       )     (
      (       )
     ( (  )  ( )
    (__(__)__(__)`;

export function Banner() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row" gap={2}>
        <Text color="yellow">{CAT_ART}</Text>
        <Box flexDirection="column" justifyContent="center">
          <Text bold color="magenta">
            Catmit
          </Text>
          <Text dimColor>AI-powered commit messages</Text>
          <Text dimColor>v0.1.0</Text>
        </Box>
      </Box>
    </Box>
  );
}
