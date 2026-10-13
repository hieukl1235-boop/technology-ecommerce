const pool = require("../config/db");

class Product {
  // Lấy danh sách sản phẩm
  static async getAll() {
    const result = await pool.query(
      `SELECT
            p.id,
            p.name,
            p.main_image,
            p.description,
            p.status,
            p.created_at,
            p.updated_at,

            c.id AS category_id,
            c.name AS category_name,

            b.id AS brand_id,
            b.name AS brand_name,

            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', pi.id,
                            'image_url', pi.image_url
                        )
                    )
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                ),
                '[]'
            ) AS images,

            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', pv.id,
                            'sku', pv.sku,
                            'selling_price', pv.selling_price,
                            'sale_price', pv.sale_price, -- 🟢 BỔ SUNG TRƯỜNG NÀY VÀO ĐÂY
                            'stock_quantity', pv.stock_quantity,
                            'image_url', pv.image_url,
                            'status', pv.status,
                            'cost_price', pv.cost_price,

                            'attributes',
                            COALESCE(
                                (
                                    SELECT json_agg(
                                        json_build_object(
                                            'attribute_id', a.id,
                                            'attribute_name', a.name,
                                            'attribute_value_id', av.id,
                                            'attribute_value', av.value
                                        )
                                    )
                                    FROM variant_attributes va
                                    JOIN attribute_values av
                                        ON va.attribute_value_id = av.id
                                    JOIN attributes a
                                        ON av.attribute_id = a.id
                                    WHERE va.variant_id = pv.id
                                ),
                                '[]'
                            )
                        )
                    )
                    FROM product_variants pv
                    WHERE pv.product_id = p.id
                ),
                '[]'
            ) AS variants

        FROM products p

        LEFT JOIN categories c
            ON p.category_id = c.id

        LEFT JOIN brands b
            ON p.brand_id = b.id

        ORDER BY p.id DESC`,
    );

    return result.rows;
  }

  // Tìm sản phẩm theo ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT *
             FROM products
             WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  }

  // Kiểm tra tên sản phẩm
  static async findByName(name) {
    const result = await pool.query(
      `SELECT id
             FROM products
             WHERE name = $1`,
      [name],
    );

    return result.rows[0];
  }

  // Thêm sản phẩm
  static async create(
    client,
    category_id,
    brand_id,
    name,
    main_image,
    description,
  ) {
    const result = await client.query(
      `INSERT INTO products
            (
                category_id,
                brand_id,
                name,
                main_image,
                description
            )
         VALUES
            ($1, $2, $3, $4, $5)
         RETURNING *`,
      [category_id, brand_id, name, main_image, description],
    );

    return result.rows[0];
  }

  // Cập nhật sản phẩm
  static async update(
    client,
    id,
    category_id,
    brand_id,
    name,
    main_image,
    description,
  ) {
    const result = await client.query(
      `UPDATE products
         SET category_id = $1,
             brand_id = $2,
             name = $3,
             main_image = $4,
             description = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
      [category_id, brand_id, name, main_image, description, id],
    );

    return result.rows[0];
  }

  // Khóa / mở khóa sản phẩm
  static async updateStatus(id) {
    const result = await pool.query(
      `UPDATE products
             SET status =
                CASE
                    WHEN status = 1 THEN 0
                    ELSE 1
                END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
      [id],
    );

    return result.rows[0];
  }

  // DÀNH CHO NGƯỜI DÙNG
  // static async getFilteredProducts({
  //   keyword,
  //   category_id,
  //   brand_id,
  //   min_price,
  //   max_price,
  //   sort,
  // }) {
  //   let query = `
  //   SELECT
  //       p.id,
  //       p.name,
  //       p.main_image,
  //       p.description,
  //       p.status,

  //       c.id AS category_id,
  //       c.name AS category_name,

  //       b.id AS brand_id,
  //       b.name AS brand_name,

  //   MIN(pv.selling_price) as min_selling_price,
  //   MIN(pv.sale_price) as min_sale_price

  //   FROM products p

  //   LEFT JOIN categories c
  //       ON p.category_id = c.id

  //   LEFT JOIN brands b
  //       ON p.brand_id = b.id

  //   LEFT JOIN product_variants pv
  //       ON p.id = pv.product_id
  //       AND pv.status = 1

  //   WHERE p.status = 1
  // `;

  //   const queryParams = [];
  //   let paramIndex = 1;

  //   // 1. Tìm kiếm theo tên sản phẩm
  //   if (keyword) {
  //     query += ` AND p.name ILIKE $${paramIndex}`;
  //     queryParams.push(`%${keyword}%`);
  //     paramIndex++;
  //   }

  //   // 2. Lọc theo danh mục
  //   if (category_id) {
  //     query += ` AND p.category_id = $${paramIndex}`;
  //     queryParams.push(category_id);
  //     paramIndex++;
  //   }

  //   // 3. Lọc theo thương hiệu
  //   if (brand_id) {
  //     query += ` AND p.brand_id = $${paramIndex}`;
  //     queryParams.push(brand_id);
  //     paramIndex++;
  //   }

  //   // 4. Lọc theo khoảng giá
  //   if (min_price || max_price) {
  //     query += `
  //     AND EXISTS (
  //       SELECT 1
  //       FROM product_variants pv_filter
  //       WHERE pv_filter.product_id = p.id
  //         AND pv_filter.status = 1
  //   `;

  //     if (min_price) {
  //       query += `
  //       AND COALESCE(
  //         pv_filter.sale_price,
  //         pv_filter.selling_price
  //       ) >= $${paramIndex}
  //     `;

  //       queryParams.push(min_price);
  //       paramIndex++;
  //     }

  //     if (max_price) {
  //       query += `
  //       AND COALESCE(
  //         pv_filter.sale_price,
  //         pv_filter.selling_price
  //       ) <= $${paramIndex}
  //     `;

  //       queryParams.push(max_price);
  //       paramIndex++;
  //     }

  //     query += `)`;
  //   }

  //   // Gom nhóm sản phẩm
  //   query += `
  //   GROUP BY
  //       p.id,
  //       p.name,
  //       p.main_image,
  //       p.description,
  //       p.status,
  //       c.id,
  //       c.name,
  //       b.id,
  //       b.name
  // `;

  //   // 5. Sắp xếp
  //   if (sort === "price_asc") {
  //     query += ` ORDER BY min_price ASC`;
  //   } else if (sort === "price_desc") {
  //     query += ` ORDER BY min_price DESC`;
  //   } else {
  //     query += ` ORDER BY p.id DESC`;
  //   }

  //   const result = await pool.query(query, queryParams);

  //   return result.rows;
  // }
  static async getFilteredProducts({
    keyword,
    category_id,
    brand_id,
    min_price,
    max_price,
    sort,
    limit = 10,
    offset = 0,
  }) {
    let query = `
    SELECT
        p.id,
        p.name,
        p.main_image,
        p.description,
        p.status,

        c.id AS category_id,
        c.name AS category_name,
        b.id AS brand_id,
        b.name AS brand_name,

        MIN(pv.selling_price) as min_selling_price,
        MIN(pv.sale_price) as min_sale_price,

        -- 🟢 1. Subquery tính điểm đánh giá trung bình độc lập, không sợ nhân bản dòng
        COALESCE(
            (
                SELECT ROUND(AVG(r.rating), 1)
                FROM reviews r
                JOIN product_variants pv_r ON r.variant_id = pv_r.id
                WHERE pv_r.product_id = p.id
            ), 0
        ) as avg_review,

        -- 🟢 2. Subquery đếm tổng số lượng đánh giá
        COALESCE(
            (
                SELECT COUNT(r.id)
                FROM reviews r
                JOIN product_variants pv_r ON r.variant_id = pv_r.id
                WHERE pv_r.product_id = p.id
            ), 0
        ) as count_review,

        -- 🟢 3. Subquery tính tổng số lượng sản phẩm đã bán (cộng dồn quantity trong order_details)
        COALESCE(
            (
                SELECT SUM(od.quantity)
                FROM order_details od
                JOIN product_variants pv_od ON od.variant_id = pv_od.id
                WHERE pv_od.product_id = p.id
            ), 0
        ) as count_sell

    FROM products p
    
    LEFT JOIN categories c
        ON p.category_id = c.id

    LEFT JOIN brands b
        ON p.brand_id = b.id

    LEFT JOIN product_variants pv
        ON p.id = pv.product_id
        AND pv.status = 1

    WHERE p.status = 1
  `;

    const queryParams = [];
    let paramIndex = 1;

    // 1. Tìm kiếm theo tên sản phẩm
    if (keyword) {
      query += ` AND p.name ILIKE $${paramIndex}`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    // 2. Lọc theo danh mục
    if (category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      queryParams.push(category_id);
      paramIndex++;
    }

    // 3. Lọc theo thương hiệu
    if (brand_id) {
      query += ` AND p.brand_id = $${paramIndex}`;
      queryParams.push(brand_id);
      paramIndex++;
    }

    // 4. Lọc theo khoảng giá
    if (min_price || max_price) {
      query += `
      AND EXISTS (
        SELECT 1
        FROM product_variants pv_filter
        WHERE pv_filter.product_id = p.id
          AND pv_filter.status = 1
    `;

      if (min_price) {
        query += `
        AND COALESCE(
          pv_filter.sale_price,
          pv_filter.selling_price
        ) >= $${paramIndex}
      `;

        queryParams.push(min_price);
        paramIndex++;
      }

      if (max_price) {
        query += `
        AND COALESCE(
          pv_filter.sale_price,
          pv_filter.selling_price
        ) <= $${paramIndex}
      `;

        queryParams.push(max_price);
        paramIndex++;
      }

      query += `)`;
    }

    // Gom nhóm sản phẩm theo các cột chính của bảng products, categories, brands
    query += `
    GROUP BY
        p.id,
        p.name,
        p.main_image,
        p.description,
        p.status,
        c.id,
        c.name,
        b.id,
        b.name
  `;

    // 5. Sắp xếp giá tối ưu
    if (sort === "price_asc") {
      query += ` ORDER BY MIN(COALESCE(pv.sale_price, pv.selling_price)) ASC`;
    } else if (sort === "price_desc") {
      query += ` ORDER BY MAX(COALESCE(pv.sale_price, pv.selling_price)) DESC`;
    } else {
      query += ` ORDER BY p.id DESC`;
    }

    // 6. Phân trang
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    return result.rows;
  }
}

module.exports = Product;
