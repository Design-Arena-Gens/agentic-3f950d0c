import CarFeed from './components/CarFeed';
import { fetchCarArticles } from '@/lib/fetchCarFeeds';

export const revalidate = 300;

export default async function Page() {
  const articles = await fetchCarArticles();

  return (
    <main className="container">
      <CarFeed initialArticles={articles} />
    </main>
  );
}
