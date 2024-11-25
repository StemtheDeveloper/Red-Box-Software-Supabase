import ME from '../assets/Images/Business-profile2.JPG'
import GPC from '../assets/Images/GP creamvil walk animation.gif'

const Home = () => {
  return (
    <div className='homepage'>
      <h1>Home Page</h1>
      /* Hero Section */
      <section>
        <h2>Welcome to our site!</h2>
        <p>
          We are a proudly New Zealand owned and operated company that specializes in providing high-quality software solutions to businesses of all sizes. We are determined to help you succeed in the digital age by providing you with the tools you need to thrive.
        </p>
      </section>
      <h4>
        Who we are
      </h4>
      <ul>

        <img id="me" src={ME} alt="Just me, the guy what made this here website" />

      </ul>

      <p>Yep, just me for now.</p>

      <ul>
        <h4>What we do</h4>
        <li>⬡ We design and develop websites</li>
        <li>⬡ We provide robotic process automation solutions for companies of all sizes</li>
        <li>⬡ We are experienced with graphic design, marketing, and business strategy</li>
        <li>⬡ We provide consultancy services for businesses looking to improve their digital presence</li>
        <li>⬡ We develop apps for Windows desktop</li>

        <h4>Don't see what you're looking for?</h4>

        <p>No worries, if it's to do with computers, we'll do our best to find a solution for you!</p>
      </ul>
      {/* News Section */}
      <section>
        <h2>Latest News</h2>
        <ul>
          <li>News item 1</li>
          <li>News item 2</li>
          <li>News item 3</li>
        </ul>
      </section>

      {/* Featured Products Section */}
      <section>
        <h2>Featured Products</h2>
        <ul>
          <li>Product 1</li>
          <li>Product 2</li>
          <li>Product 3</li>
        </ul>
      </section>

      {/* Admin Section */}
      <section>
        <h2>Admin</h2>
        <a href="/admin">Go to Admin Page</a>
      </section>

      {/* Random shape */}

      <section>
        <div className="shape">
          <img id='clipPath' src={GPC} alt="A weird animation" />
        </div>
      </section>
    </div>
  )
}

export default Home