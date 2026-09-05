CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tenders (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    tender_amount NUMERIC(15, 2) NOT NULL,
    security_deposit NUMERIC(15, 2) NOT NULL,
    deadline TIMESTAMP,
    status VARCHAR(30) DEFAULT 'OPEN',
    winner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER REFERENCES tenders(id) ON DELETE CASCADE,
    contractor_id INTEGER REFERENCES users(id),
    bid_amount NUMERIC(15, 2) NOT NULL,
    security_deposit NUMERIC(15, 2) NOT NULL,
    documents TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    transaction_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER REFERENCES tenders(id),
    owner_id INTEGER REFERENCES users(id),
    contractor_id INTEGER REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    total_amount NUMERIC(15, 2),
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    subcontractor_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2),
    proof TEXT,
    status VARCHAR(40) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE inspections (
    id SERIAL PRIMARY KEY,
    milestone_id INTEGER REFERENCES milestones(id) ON DELETE CASCADE,
    inspector_id INTEGER REFERENCES users(id),
    status VARCHAR(40) DEFAULT 'PENDING',
    report TEXT,
    evidence TEXT,
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    from_user INTEGER REFERENCES users(id),
    to_user INTEGER REFERENCES users(id),
    amount NUMERIC(15, 2),
    status VARCHAR(30) DEFAULT 'CONFIRMED',
    tx_hash VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);