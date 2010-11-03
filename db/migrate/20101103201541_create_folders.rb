class CreateFolders < ActiveRecord::Migration
  def self.up
    create_table :folders do |t|
      t.string :name, :unique => true
      t.boolean :public, :default => true
      t.boolean :admin, :default => false

      t.timestamps
    end
  end

  def self.down
    drop_table :folders
  end
end
