import "dotenv/config";
import { createPool } from "mariadb";

const url = process.env.DATABASE_URL?.replace(/^mysql:\/\//, "mariadb://");
if (!url) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const pool = createPool({
  uri: url,
  connectTimeout: 10000,
  multipleStatements: true,
});

const conn = await pool.getConnection();

const tables = [
  {
    name: "users",
    sql: `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      nlogin_id INT NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      role ENUM('ALUNO','PROFESSOR','MODERADOR','ADMIN') NOT NULL DEFAULT 'ALUNO',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_users_nlogin FOREIGN KEY (nlogin_id) REFERENCES nlogin(ai) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "profiles",
    sql: `CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL UNIQUE,
      avatar VARCHAR(500),
      bio TEXT,
      sapiens_coins INT NOT NULL DEFAULT 0,
      xp INT NOT NULL DEFAULT 0,
      CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "products",
    sql: `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      category ENUM('VIP','RANK','COSMETICO','MOEDA','KIT') NOT NULL,
      image_url VARCHAR(500),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "coupons",
    sql: `CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      discount DECIMAL(5,2) NOT NULL,
      max_uses INT,
      \`uses\` INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "orders",
    sql: `CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL,
      status ENUM('PENDING','APPROVED','REJECTED','REFUNDED') NOT NULL DEFAULT 'PENDING',
      total DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50),
      payment_id VARCHAR(255),
      coupon_id VARCHAR(30),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "order_items",
    sql: `CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      order_id VARCHAR(30) NOT NULL,
      product_id VARCHAR(30) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10,2) NOT NULL,
      CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "forum_categories",
    sql: `CREATE TABLE IF NOT EXISTS forum_categories (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      icon VARCHAR(50),
      \`order\` INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "posts",
    sql: `CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id VARCHAR(30) NOT NULL,
      category_id VARCHAR(30) NOT NULL,
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      locked BOOLEAN NOT NULL DEFAULT FALSE,
      views INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_posts_cat FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "comments",
    sql: `CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      content TEXT NOT NULL,
      author_id VARCHAR(30) NOT NULL,
      post_id VARCHAR(30) NOT NULL,
      parent_id VARCHAR(30),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "reactions",
    sql: `CREATE TABLE IF NOT EXISTS reactions (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL,
      post_id VARCHAR(30),
      comment_id VARCHAR(30),
      type ENUM('LIKE','DISLIKE') NOT NULL,
      CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_reactions_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_reactions_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
      UNIQUE KEY uq_reaction_post (user_id, post_id),
      UNIQUE KEY uq_reaction_comment (user_id, comment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "reports",
    sql: `CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      user_id VARCHAR(30) NOT NULL,
      reason TEXT NOT NULL,
      post_id VARCHAR(30),
      comment_id VARCHAR(30),
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "blog_categories",
    sql: `CREATE TABLE IF NOT EXISTS blog_categories (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "blog_posts",
    sql: `CREATE TABLE IF NOT EXISTS blog_posts (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      content LONGTEXT NOT NULL,
      excerpt TEXT,
      cover_image VARCHAR(500),
      category_id VARCHAR(30) NOT NULL,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      published_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_bp_cat FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "contact_messages",
    sql: `CREATE TABLE IF NOT EXISTS contact_messages (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
  {
    name: "newsletter",
    sql: `CREATE TABLE IF NOT EXISTS newsletter (
      id VARCHAR(30) NOT NULL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      confirmed BOOLEAN NOT NULL DEFAULT FALSE,
      confirm_token VARCHAR(255) UNIQUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  },
];

for (const table of tables) {
  try {
    await conn.query(table.sql);
    console.log(`✓ ${table.name}`);
  } catch (e) {
    console.error(`✗ ${table.name}: ${e.message}`);
  }
}

console.log("\nDone!");
conn.release();
await pool.end();
