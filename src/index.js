import Penina, { render, createRef, Component } from './penina';
import './index.scss';

localStorage.getItem('openLibrary.index') ||
  localStorage.setItem('openLibrary.index', 0);

const store = {
  categories: ['Spiritual', 'Science', 'Documentary', 'Fiction', 'Thriller'],
  books: JSON.parse(localStorage.getItem('openLibrary.books')) || [],
};

const Book = Component(function({ title, author, pages, read, category }) {
  const remove = () => {
    const { id } = this.props;
    store.books = store.books.filter(book => book.id !== id);
    localStorage.setItem('openLibrary.books', JSON.stringify(store.books));
    this.remove();
  };
  const toggleReadStatus = () => {
    const { id, read } = this.props;
    store.books = store.books.map(book => {
      return book.id !== id ? book : Object.assign(book, { read: !book.read });
    });
    localStorage.setItem('openLibrary.books', JSON.stringify(store.books));
    this.update({ read: !read });
  };
  return (
    <li class="book">
      <h3>{title}</h3>
      <p>
        <span>Author:</span>
        <span>{author}</span>
      </p>
      <p>
        <span>Pages:</span>
        <span>{pages}</span>
      </p>
      <p>
        <span>Category:</span>
        <span>{category}</span>
      </p>
      <p>
        <span>Read:</span>
        <span class={`read ${read ? 'on' : ''}`} onclick={toggleReadStatus}>
          <i class="switch"></i>
          <i class="status">{read ? 'YES' : 'NO'}</i>
        </span>
      </p>
      <button onclick={remove}>Remove</button>
    </li>
  );
});

const Shelf = Component(({ items }) => {
  return (
    <ul class="shelf">
      {items.map(item => (
        <Book {...item} />
      ))}
    </ul>
  );
});

const Form = Component(({ shelfRef }) => {
  const formRef = createRef();
  const titleRef = createRef();
  const authorRef = createRef();
  const pagesRef = createRef();
  const categRef = createRef();
  const readRef = createRef();

  const handleSubmit = e => {
    e.preventDefault();
    const [title, author, pages, category, read] = [
      titleRef.current.value,
      authorRef.current.value,
      pagesRef.current.value,
      categRef.current.value,
      Boolean(parseInt(readRef.current.value)),
    ];
    const id = parseInt(localStorage.getItem('openLibrary.index'));
    const book = {
      id,
      title,
      author,
      category,
      pages,
      read,
    };
    store.books.push(book);
    localStorage.setItem('openLibrary.index', id + 1);
    localStorage.setItem('openLibrary.books', JSON.stringify(store.books));
    e.target.reset();
    shelfRef.current.appendChild(Book.new({ ...book }).mount());
  };

  const toggleForm = e => {
    const form = formRef.current;
    form.classList.toggle('hide');
    e.target.innerHTML = e.target.innerHTML === '+' ? '-' : '+';
  };

  return (
    <div class="form-wrapper">
      <button onclick={toggleForm}>+</button>
      <form ref={formRef} onsubmit={handleSubmit} class="hide">
        <p>
          <label>Title: </label>
          <input type="text" ref={titleRef} />
        </p>
        <p>
          <label>Author: </label>
          <input type="text" ref={authorRef} />
        </p>
        <p>
          <label>Pages: </label>
          <input type="number" value="1" min="1" ref={pagesRef} />
        </p>
        <p>
          <label>Category: </label>
          <select ref={categRef}>
            {store.categories.map(categ => (
              <option value={categ}>{categ}</option>
            ))}
          </select>
        </p>
        <p>
          <label>Read: </label>
          <select ref={readRef}>
            <option value="0">NO</option>
            <option value="1">YES</option>
          </select>
        </p>
        <input type="submit" value="Add book" />
      </form>
    </div>
  );
});

const Library = Component(() => {
  const shelfRef = createRef();
  const filter = e => {
    const { value } = e.target;
    let items;
    if (value === 'All') items = store.books;
    else items = store.books.filter(book => book.category === value);
    shelfRef.current.component.update({ items });
  };

  return (
    <>
      <header>
        <h1>Open Library</h1>
      </header>
      <section>
        <Form shelfRef={shelfRef} />
        <main>
          <div class="filter">
            Category
            <select onchange={filter}>
              {['All'].concat(store.categories).map(categ => (
                <option value={categ}>{categ}</option>
              ))}
            </select>
          </div>
          <Shelf ref={shelfRef} items={store.books} />
        </main>
      </section>
      <footer>
        Powered by
        <a href="https://github.com/FabienNeibaf" target="_blank">
          Fabien
        </a>
      </footer>
    </>
  );
});

render(<Library />, document.getElementById('root'));
