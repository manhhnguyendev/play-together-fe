import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { playerStatusColor, playerStatusLabel } from '@/features/discovery/status';
import { fonts } from '@/theme';

interface StatusTextProps {
  status?: string | null;
  size?: number;
  style?: StyleProp<TextStyle>;
}

export function StatusText({ status, size = 13, style }: StatusTextProps) {
  return (
    <Text
      style={[
        styles.text,
        { fontSize: size, color: playerStatusColor(status) },
        style,
      ]}
      numberOfLines={1}
    >
      {playerStatusLabel(status)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.medium },
});
