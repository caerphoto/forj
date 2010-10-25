class BiggerPosts < ActiveRecord::Migration
  def self.up
      change_column :posts, :content, :text, :limit => 4000
  end

  def self.down
  end
end
