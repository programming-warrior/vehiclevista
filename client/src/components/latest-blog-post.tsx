import { Card } from "@/components/ui/card";
import { Link } from "wouter";

type BlogPost = {
  id: string;
  title: string;
  image: string;
  tag: string;
  author: string;
  date: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "2024 BMW ALPINA XB7 with exclusive details, extraordinary",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800",
    tag: "Sound",
    author: "Admin",
    date: "November 22, 2024"
  },
  {
    id: "2",
    title: "BMW X6 M50i is designed to exceed your sportiest.",
    image: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=800",
    tag: "Accessories",
    author: "Admin",
    date: "November 24, 2024"
  },
  {
    id: "3",
    title: "BMW X5 Gold 2024 Sport Review: Light on Sport",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800",
    tag: "Exterior",
    author: "Admin",
    date: "December 12, 2024"
  }
];

export default function LatestBlogPost() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Latest Blog Post</h2>
          <Link href="/blog" className="text-sm bg-gray-100 px-4 py-1 rounded-full hover:bg-gray-200">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="group overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img
                  src={post.image}
                  alt={post.title}
                  className="object-cover w-full h-full"
                />
                <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm">
                  {post.tag}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span>{post.author}</span>
                  <span className="mx-2">•</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="font-medium text-lg hover:text-blue-600 transition-colors">
                  <Link href={`/blog/${post.id}`}>
                    {post.title}
                  </Link>
                </h3>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
