class OverNineThousand < ActiveRecord::Migration
  def self.up
      change_column :posts, :content, :text, :limit => 9001
  end

  def self.down
  end
end
