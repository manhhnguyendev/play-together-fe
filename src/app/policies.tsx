import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing } from '@/theme';

const TERMS =
  'Điều khoản sử dụng:\n' +
  '1.1 Thành viên hoặc người dùng sử dụng app Play Together phải đảm đã đọc rõ và hiểu các điều khoản liên quan đến việc sử dụng công cụ của Player Together cùng các điều khoản về bảo mật thông tin sẽ được liệt kê dưới đây.\n' +
  '1.2 Người dùng cam kết sử dụng các công cụ của Play Together không vì mục đích chính trị, tôn giáo hoặc vi phạm các quy định pháp luật hiện hành trên môi trường Internet. Trong trường hợp vi phạm, Play Together có quyền xóa người dùng ngay lập tức mà không cần báo trước.\n' +
  '1.3 Tất cả các trường hợp người dùng đăng tải nội dung vi phạm những điều dưới đây đều có thể dẫn đến tài khoản bị cấm tính năng hoặc nặng nhất là banned vĩnh viễn tài khoản tại Play Together:\n' +
  'Thông tin, hình ảnh,... có nội dung nhằm vào mục đích phá hoại, lôi kéo, bôi nhọ uy tín, nói sai sự thật đối với các đối tác trên hệ thống Play Together.\n' +
  'Thông tin, hình ảnh,... có sử dụng từ ngữ, hình ảnh phản cảm, đồi trụy, trái với thuần phong mỹ tục Việt Nam.\n';

const PARAGRAPHS = TERMS.split('\n').filter((line) => line.trim().length > 0);
const [HEADING, ...BODY] = PARAGRAPHS;

export default function PoliciesScreen() {
  const { gutter, contentStyle, type } = useResponsive();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chính sách" />
      <ScrollView
        style={contentStyle}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: gutter }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={[styles.heading, type.title3]} accessibilityRole="header">
            {HEADING}
          </Text>
          {BODY.map((paragraph) => (
            <Text key={paragraph} style={[styles.paragraph, type.body]} selectable>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heading: { color: colors.text },
  paragraph: { color: colors.text },
});
