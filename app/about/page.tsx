export const metadata = {
  title: "About",
  description: "Learn about Galaxy of Thoughts - an interactive 3D universe where every star represents a unique thought, idea, or dream from people worldwide.",
  openGraph: {
    title: "About Galaxy of Thoughts",
    description: "Discover how Galaxy of Thoughts connects people through an immersive 3D space experience.",
  },
};

export default function About() {
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: 1.6,
      color: '#ffffff',
      background: '#000000'
    }}>
      <h1>About Galaxy of Thoughts</h1>
      
      <section>
        <h2>What is Galaxy of Thoughts?</h2>
        <p>
          Galaxy of Thoughts is an interactive 3D universe where every star represents a unique thought, 
          idea, or dream shared by people from around the world. It's a beautiful visualization of 
          collective human imagination in space.
        </p>
      </section>

      <section>
        <h2>How It Works</h2>
        <ul>
          <li><strong>Explore:</strong> Navigate through a stunning 3D galaxy filled with stars</li>
          <li><strong>Discover:</strong> Click on any star to read its message</li>
          <li><strong>Share:</strong> Add your own star with a thought or idea (10-280 characters)</li>
          <li><strong>Connect:</strong> Experience thoughts from people worldwide in real-time</li>
        </ul>
      </section>

      <section>
        <h2>Technology</h2>
        <p>
          Built with cutting-edge web technologies including Next.js, React Three Fiber, and WebGL 
          for smooth 3D rendering. Powered by advanced AI content moderation to ensure a safe and 
          positive experience for everyone.
        </p>
      </section>

      <section>
        <h2>Safety & Moderation</h2>
        <p>
          We use multiple layers of AI-powered content moderation (OpenAI and Google Perspective API) 
          to ensure all messages are appropriate and respectful. Our platform promotes positive 
          expression and human connection.
        </p>
      </section>

      <section>
        <h2>Get Started</h2>
        <p>
          <a href="/" style={{ color: '#4da6ff', textDecoration: 'none' }}>
            Return to the Galaxy →
          </a>
        </p>
      </section>
    </div>
  );
}
