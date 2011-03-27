class BetterDefaults < ActiveRecord::Migration
  def self.up
      change_column :folders, :name, :string, :null => false, :limit => 50

      change_column :msg_threads, :title, :string, :null => false, :limit => 255

      # Defaults so they don't need to be specified when creating posts
      change_column :posts, :reply_user_id, :integer, :default => 0
      change_column :posts, :reply_index, :integer, :default => 0

      change_column :posts, :content, :text, :limit => 10000
  end

  def self.down
  end
end
