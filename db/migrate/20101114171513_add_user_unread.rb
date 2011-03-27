class AddUserUnread < ActiveRecord::Migration
  def self.up
      add_column :users, :last_read, :text
  end

  def self.down
      remove_column :users, :last_read
  end
end
