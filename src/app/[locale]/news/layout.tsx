import { NewsKeyboardWrapper } from "@/components/news/NewsKeyboardWrapper";

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <NewsKeyboardWrapper>
      {children}
    </NewsKeyboardWrapper>
  );
}
