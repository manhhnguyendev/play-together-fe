import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';

const TERMS =
  'Điều khoản sử dụng:\n' +
  '1.1 Thành viên hoặc người dùng sử dụng app Play Together phải đảm đã đọc rõ và hiểu các điều khoản liên quan đến việc sử dụng công cụ của Player Together cùng các điều khoản về bảo mật thông tin sẽ được liệt kê dưới đây.\n' +
  '1.2 Người dùng cam kết sử dụng các công cụ của Play Together không vì mục đích chính trị, tôn giáo hoặc vi phạm các quy định pháp luật hiện hành trên môi trường Internet. Trong trường hợp vi phạm, Play Together có quyền xóa người dùng ngay lập tức mà không cần báo trước.\n' +
  '1.3 Tất cả các trường hợp người dùng đăng tải nội dung vi phạm những điều dưới đây đều có thể dẫn đến tài khoản bị cấm tính năng hoặc nặng nhất là banned vĩnh viễn tài khoản tại Play Together:\n' +
  'Thông tin, hình ảnh,... có nội dung nhằm vào mục đích phá hoại, lôi kéo, bôi nhọ uy tín, nói sai sự thật đối với các đối tác trên hệ thống Play Together.\n' +
  'Thông tin, hình ảnh,... có sử dụng từ ngữ, hình ảnh phản cảm, đồi trụy, trái với thuần phong mỹ tục Việt Nam.\n';

export default function PoliciesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Chính sách" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.text}>{TERMS}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
});
